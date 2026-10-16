import type { Drawer } from '@/Drawer';
import type { Socket } from 'socket.io-client';
import { Node } from 'konva/lib/Node';
import type { Trail } from '@/components/toolbar/widgets/Eraser/Trail';
import { createLaserTrail } from '@/components/toolbar/widgets/Laser/Laser';
import type { ShapeConfig } from 'konva/lib/Shape';
import type { Vector2d } from 'konva/lib/types';
import { Group } from 'konva/lib/Group';
import { Line } from 'konva/lib/shapes/Line';
import { Label, Tag } from 'konva/lib/shapes/Label';
import { Text } from 'konva/lib/shapes/Text';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { serializeShape } from '@/components/tools/UndoRedo/History';
import { drawerEvents } from '@/constants';
import { socketEvents } from '@free-drawing/protocol';
import { applyOrder } from '@/utils/order';
import type { DrawingShape } from '@/@types/drawer';

/**
 * Drawing change sent to other clients: shapes added or updated (konva JSON), ids of removed shapes,
 * `order`: ids of all shapes from bottom to top when stacking order changed,
 * `live`: preview of shapes being drawn or moved (final change follows)
 */
export type DrawingChange = { upsert: string[]; remove: string[]; order?: string[]; live?: boolean };

/**
 * Pointer of another user, position in drawing (null out of drawer)
 */
/** Pointer of another user: position in drawing (null out of drawer), laser used */
export type RemotePointer = { id: string; name?: string; position: (Vector2d & { laser?: boolean }) | null };

export type CollaborationSocket = Pick<Socket, 'on' | 'once' | 'emit' | 'disconnect' | 'volatile'>;

/**
 * User of a room (sent by server): owner (created the room) gives or removes the right to draw
 */
export type CollaborationMember = {
  id: string;
  name: string;
  owner: boolean;
  canEdit: boolean;
  /** Name of user who shared the link used to join */
  invitedBy?: string;
};

export type CollaborationOptions = {
  room: string;
  /** Name shown to other users */
  name: string;
  /** User id, kept between sessions (rights) */
  userId?: string;
  /** Secret of owner of the room, given when the room is created */
  ownerKey?: string;
  /** Id of user who shared the link used to join */
  invitedBy?: string;
};

/** Minimum interval of pointer and live drawing messages (ms) */
const liveInterval = 50;

const cursorColors = ['#e03131', '#2f9e44', '#1971c2', '#f08c00', '#9c36b5', '#0c8599', '#c2255c'];

/**
 * Real time collaboration in a room: changes of drawing (any tool, undo...) are sent shape by shape to other users
 * of the room, through a socket.io server (see apps/server), so concurrent drawings are merged
 */
export class Collaboration {
  readonly socket: CollaborationSocket;
  readonly room: string;
  /** Name shown to other users */
  name: string;
  /** Names of users of the room, this one included */
  users: string[] = [];
  /** Users of the room with their rights, this one included */
  members: CollaborationMember[] = [];
  /** Id of this user: given by drawer, then by server when it joins (e.g. id of logged in account) */
  userId: string;
  readonly ownerKey?: string;
  readonly invitedBy?: string;
  private readonly drawer: Drawer;
  /** Shapes as other clients know them, by id, in stacking order */
  #synced = new Map<string, string>();
  /** Changes received during a pointer action of this client, applied when it ends */
  #pending: DrawingChange[] = [];
  /** Shapes being drawn or moved, sent at next live message */
  #live = new Set<DrawingShape>();
  #pointer: (Vector2d & { laser?: boolean }) | null = null;
  /** Laser used by this user, see `setLaser` */
  #laser = false;
  /** Laser trails of other users, by user id */
  #lasers = new Map<string, Trail>();
  /** Messages waiting for live interval */
  #timers: Record<string, ReturnType<typeof setTimeout> | undefined> = {};
  #lastSent: Record<string, number> = {};
  /** Cursors of other users, by user id */
  #cursors = new Map<string, Group>();

  constructor(
    drawer: Drawer,
    socket: CollaborationSocket,
    { room, name, userId = '', ownerKey, invitedBy }: CollaborationOptions
  ) {
    this.drawer = drawer;
    this.socket = socket;
    this.room = room;
    this.name = name;
    this.userId = userId;
    this.ownerKey = ownerKey;
    this.invitedBy = invitedBy;

    this.socket.on('connect', () => {
      if (this.drawer.debug) console.log('🌍 Connected to collaboration server');
      const { room, name, userId, ownerKey, invitedBy } = this;

      this.socket.emit(socketEvents.JOIN, { room, name, userId, ownerKey, invitedBy });
      // (re)connected: whole drawing sent, merged with other ones of the room
      this.#synced.clear();
      this.send();
    });
    // server identifies this user (logged in account), before sending users of the room
    this.socket.on(socketEvents.JOINED, ({ userId }: { userId?: unknown } = {}) => {
      if (typeof userId === 'string' && userId) this.userId = userId;
    });
    this.socket.on(socketEvents.CHANGE, (change: DrawingChange) => this.receive(change));
    // names only from servers without rights
    this.socket.on(socketEvents.USERS, (users: (CollaborationMember | string)[]) => {
      const canEdit = this.canEdit;

      this.members = users.map((user) =>
        typeof user === 'string' ? { id: '', name: user, owner: false, canEdit: true } : user
      );
      this.users = this.members.map((member) => member.name);
      if (this.canEdit !== canEdit) this.drawer._onCollaborationRight(this.canEdit);
      this.drawer.trigger(drawerEvents.collaborationChange);
    });
    this.socket.on(socketEvents.POINTER, (pointer: RemotePointer) => this._showCursor(pointer));
    this.socket.on(socketEvents.LEAVE, (id: string) => {
      this.#cursors.get(id)?.destroy();
      this.#cursors.delete(id);
      this.#lasers.get(id)?.destroy();
      this.#lasers.delete(id);
    });

    // pointer shown to other users
    this.drawer.stage.on('pointermove.collaboration', () => this._sendPointer(this.drawer.stage.getRelativePointerPosition()));
    this.drawer.stage.on('mouseleave.collaboration', () => this._sendPointer(null));
  }

  /**
   * Send a message after live interval at most (latest state is read when sent)
   */
  private _schedule(key: string, send: () => void) {
    if (this.#timers[key]) return;

    const wait = Math.max(0, liveInterval - (Date.now() - (this.#lastSent[key] ?? 0)));

    this.#timers[key] = setTimeout(() => {
      this.#timers[key] = undefined;
      this.#lastSent[key] = Date.now();
      send();
    }, wait);
  }

  private _sendPointer(position: Vector2d | null) {
    this.#pointer = position && {
      x: Math.round(position.x),
      y: Math.round(position.y),
      ...(this.#laser && { laser: true }),
    };
    // dropped rather than delayed when connection is slow
    this._schedule('pointer', () => this.socket.volatile.emit(socketEvents.POINTER, this.#pointer));
  }

  /**
   * Laser used (pressed) by this user: its trail is shown to other users with pointer
   * @param {boolean} on
   */
  setLaser(on: boolean) {
    if (this.#laser === on) return;

    this.#laser = on;
    // end told at once, pointer may not move (or be out of canvas)
    this._sendPointer(this.drawer._hasPointer() ? this.drawer._getRelativePointerPos() : null);
  }

  /**
   * Shapes being drawn or moved shown to other users while drawing, final state is sent by `send` on change
   */
  sendLive(shapes: DrawingShape[]) {
    // shapes of groups: whole group
    shapes.forEach((shape) => {
      const drawingShape = this.drawer.getDrawingShapes().find((s) => s === shape || s.isAncestorOf(shape));

      if (drawingShape) this.#live.add(drawingShape);
    });
    this._schedule('live', () => {
      const upsert = [...this.#live].filter((shape) => shape.getLayer()).map(serializeShape);

      this.#live.clear();
      if (upsert.length) {
        this.socket.volatile.emit(socketEvents.CHANGE, { upsert, remove: [], live: true } satisfies DrawingChange);
      }
    });
  }

  /**
   * Cursor of another user with name, created on first position
   */
  private _showCursor({ id, name, position }: RemotePointer) {
    let cursor = this.#cursors.get(id);
    let laser = this.#lasers.get(id);

    if (!position) {
      cursor?.hide();
      laser?.stop();
      return;
    }

    // laser of this user: trail of their color following their pointer
    if (position.laser) {
      if (!laser) {
        laser = createLaserTrail(this.drawer.selectionLayer, this._color(id));
        this.#lasers.set(id, laser);
      }
      laser.start();
      laser.add(position.x, position.y);
    } else {
      laser?.stop();
    }

    if (!cursor) {
      cursor = this._createCursor(id);
      this.#cursors.set(id, cursor);
      this.drawer.selectionLayer.add(cursor);
    }

    cursor.findOne<Text>('Text')?.text(name || this.drawer.t('collab.anonymous'));
    cursor.setAttrs({ x: position.x, y: position.y, visible: true });
    // above selection, guides...
    cursor.moveToTop();
  }

  /**
   * Color of a user: their cursor and laser
   */
  private _color(id: string) {
    return cursorColors[[...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % cursorColors.length];
  }

  private _createCursor(id: string) {
    const color = this._color(id);
    const cursor = new Group({ name: 'collaborator-cursor', listening: false });
    const label = new Label({ x: 12, y: 18 });

    // arrow pointing to position
    cursor.add(
      new Line({ points: [0, 0, 0, 17, 4.5, 13, 7.5, 20, 10, 19, 7, 12, 12.5, 12], closed: true, fill: color, stroke: '#fff', strokeWidth: 1.5, lineJoin: 'round' })
    );
    label.add(new Tag({ fill: color, cornerRadius: 4 }));
    label.add(new Text({ fontFamily: 'system-ui, sans-serif', fontSize: 12, padding: 4, fill: '#fff' }));
    cursor.add(label);
    this._scaleCursor(cursor);

    return cursor;
  }

  // same size on screen whatever zoom
  private _scaleCursor(cursor: Group) {
    const scale = 1 / this.drawer.getZoomLevel();

    cursor.scale({ x: scale, y: scale });
  }

  /**
   * Cursors size kept after zoom
   */
  updateCursors() {
    this.#cursors.forEach((cursor) => this._scaleCursor(cursor));
  }

  /**
   * This user created the room: gives or removes the right to draw
   */
  get isOwner(): boolean {
    // owner secret: known before users list
    return !!this.members.find((member) => member.id === this.userId)?.owner || (!this.members.length && !!this.ownerKey);
  }

  /**
   * This user can draw (given by owner of the room)
   */
  get canEdit(): boolean {
    return this.members.find((member) => member.id === this.userId)?.canEdit ?? true;
  }

  /**
   * Give or remove the right to draw to a user of the room (owner only, checked by server)
   */
  setRight(userId: string, canEdit: boolean) {
    this.socket.emit(socketEvents.RIGHTS, { userId, canEdit });
  }

  /**
   * Change name shown to other users
   */
  setName(name: string) {
    this.name = name;
    this.socket.emit(socketEvents.NAME, name);
  }

  /**
   * Leave room, cursors of other users removed
   */
  stop() {
    this.socket.disconnect();
    this.drawer.stage.off('.collaboration');
    Object.values(this.#timers).forEach((timer) => clearTimeout(timer));
    this.#cursors.forEach((cursor) => cursor.destroy());
    this.#cursors.clear();
    this.#lasers.forEach((laser) => laser.destroy());
    this.#lasers.clear();
  }

  /**
   * Send shapes changed since last sync, called on drawer change
   */
  send() {
    const current = new Map(this.drawer.getDrawingShapes().map((shape) => [shape.id(), serializeShape(shape)]));
    const upsert = [...current].filter(([id, json]) => this.#synced.get(id) !== json).map(([, json]) => json);
    const remove = [...this.#synced.keys()].filter((id) => !current.has(id));
    const ids = [...current.keys()];
    const added = ids.filter((id) => !this.#synced.has(id));
    // stacking order of known shapes changed (reorder, undo...), or new shapes not on top (group, ungroup...):
    // new shapes are added on top by others
    const reordered =
      ids.filter((id) => this.#synced.has(id)).join() !==
        [...this.#synced.keys()].filter((id) => current.has(id)).join() ||
      added.join() !== ids.slice(ids.length - added.length).join();
    const change: DrawingChange = { upsert, remove, ...(reordered && { order: [...current.keys()] }) };

    this.#synced = current;
    // final state sent, previews useless
    this.#live.clear();
    if (upsert.length || remove.length || reordered) this.socket.emit(socketEvents.CHANGE, change);
  }

  /**
   * Apply change of another client, after current pointer action (not to alter shape being drawn)
   */
  receive(change: DrawingChange) {
    // preview of other users drawing: shown at once, not saved nor added to history (final change follows)
    if (change.live) {
      this._apply(change);
      return;
    }

    if (this.drawer._duringAction()) {
      this.#pending.push(change);
      return;
    }

    this._apply(change);
    // saved and added to history, not sent back (synced)
    this.drawer.stage.fire('change');
  }

  /**
   * Apply changes received during a pointer action
   * @returns true if a change was applied
   */
  flush() {
    const pending = this.#pending;

    this.#pending = [];
    pending.forEach((change) => this._apply(change));

    return pending.length > 0;
  }

  private _apply({ upsert, remove, order }: DrawingChange) {
    const shapes = new Map(this.drawer.getDrawingShapes().map((shape) => [shape.id(), shape]));

    remove.forEach((id) => {
      shapes.get(id)?.destroy();
      this.#synced.delete(id);
    });

    upsert.forEach((json) => {
      const { attrs, className } = JSON.parse(json) as { attrs: ShapeConfig; className: string };
      let shape = shapes.get(attrs.id as string);

      // groups replaced with their shapes, at same place, still selected
      if (shape && (shape instanceof Group || className === 'Group')) {
        const index = shape.zIndex();
        const selected = this.drawer.getSelectedShapes();

        shape.destroy();
        shape = this.drawer.addShape(Node.create(json) as DrawingShape);
        shape.zIndex(index);
        if (selected.some((node) => !node.getLayer())) {
          this.drawer.getWidget<SelectWidget>('selection')?.select([...selected.filter((node) => node.getLayer()), shape]);
        }
      } else if (shape) {
        // same node (kept in selection): attributes removed by other client are removed, not local ones (draggable,
        // hit function)
        const node: Node = shape;

        Object.keys(node.attrs)
          .filter((key) => !(key in attrs) && key !== 'draggable' && typeof node.getAttr(key) !== 'function')
          .forEach((key) => node.setAttr(key, undefined));
        shape.setAttrs(attrs);
      } else {
        shape = this.drawer.addShape(Node.create(json) as DrawingShape);
      }
      // as serialized here, not to send it back
      this.#synced.set(shape.id(), serializeShape(shape));
    });

    if (order) {
      applyOrder(this.drawer.getDrawingShapes(), order);
      // known in this order, not to send it back
      this.#synced = new Map(
        this.drawer
          .getDrawingShapes()
          .filter((shape) => this.#synced.has(shape.id()))
          .map((shape) => [shape.id(), this.#synced.get(shape.id())!])
      );
    }

    // removed shapes are not selected anymore
    const transformer = this.drawer.getWidget<SelectWidget>('selection')?.transformer;
    if (transformer && remove.length) transformer.nodes(transformer.nodes().filter((node) => node.getLayer()));
  }
}
