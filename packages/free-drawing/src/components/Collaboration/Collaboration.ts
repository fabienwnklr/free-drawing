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
import { parseShapeState } from '@/utils/drawingFile';
import type { DrawingShape } from '@/@types/drawer';

/**
 * Drawing change sent to other clients: shapes added or updated (konva JSON), ids of removed shapes,
 * `order`: ids of all shapes from bottom to top when stacking order changed,
 * `live`: preview of shapes being drawn or moved (final change follows)
 */
export type DrawingChange = {
  /** Shapes added or updated: konva JSON of top nodes (groups with their shapes) */
  upsert: string[];
  /** Ids of removed shapes */
  remove: string[];
  /** Ids of all shapes from bottom to top, only when stacking order changed */
  order?: string[];
  /** Preview of shapes being drawn or moved: applied without history, the final change follows */
  live?: boolean;
  /** Whole drawing of the room, sent by the server to a joining user (also empty) */
  full?: boolean;
};

/** Pointer of another user: position in drawing (null out of drawer), laser used */
export type RemotePointer = {
  /** Id of the user, identifies their cursor and laser trail */
  id: string;
  /** Name shown in their cursor (anonymous when empty) */
  name?: string;
  /** Position in drawing, null when the pointer left the drawer (cursor hidden) */
  position:
    | (Vector2d & {
        /** Laser pressed: trail of their color follows the pointer */
        laser?: boolean;
      })
    | null;
};

/**
 * Part of a socket.io client socket used by collaboration (connected by the drawer, replaced by fakes in tests)
 */
export type CollaborationSocket = Pick<Socket, 'on' | 'once' | 'emit' | 'disconnect' | 'volatile'>;

/**
 * User of a room (sent by server): owner (created the room) gives or removes the right to draw
 */
export type CollaborationMember = {
  /** Id of the user (account id of a logged in user) */
  id: string;
  /** Name shown to other users */
  name: string;
  /** Created the room: gives or removes the right to draw */
  owner: boolean;
  /** Can draw (right given by the owner), else views only */
  canEdit: boolean;
  /** Name of user who shared the link used to join */
  invitedBy?: string;
};

/**
 * Session of a {@link Collaboration}: room to join and identity of this user
 */
export type CollaborationOptions = {
  /** Id of the room (`#room=` of links) */
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
  /** Socket connected to the collaboration server, disconnected by `stop` */
  readonly socket: CollaborationSocket;
  /** Id of the room */
  readonly room: string;
  /** Name shown to other users */
  name: string;
  /** Names of users of the room, this one included */
  users: string[] = [];
  /** Users of the room with their rights, this one included */
  members: CollaborationMember[] = [];
  /** Users coming for the first time can draw (setting of the owner), else they view only */
  newUsersCanEdit = true;
  /** Id of this user: given by drawer, then by server when it joins (e.g. id of logged in account) */
  userId: string;
  /** Secret of the owner of the room, sent on join: the server makes this user its owner */
  readonly ownerKey?: string;
  /** Id of the user who shared the link used to join, sent on join (the server gives their name to the owner) */
  readonly invitedBy?: string;
  /** Drawer whose drawing is shared */
  private readonly drawer: Drawer;
  /** Shapes as other clients know them, by id, in stacking order */
  #synced = new Map<string, string>();
  /** Time of the last warning of a change refused by the server (drawing too big), shown again after a while */
  #tooBigAt = 0;
  /** Changes received during a pointer action of this client, applied when it ends */
  #pending: DrawingChange[] = [];
  /** Connected to the server: changes made while disconnected are sent once joined again */
  #connected = false;
  /** Joined the room before: a reconnection merges the drawing of the room with changes made meanwhile */
  #joined = false;
  /** Joined again, drawing of the room awaited: nothing sent meanwhile */
  #rejoining = false;
  /** Drawing of the room received again during a pointer action of this client, merged when it ends */
  #rejoinDrawing: DrawingChange | null = null;
  /** Shapes being drawn or moved, sent at next live message */
  #live = new Set<DrawingShape>();
  /** Last pointer position of this user in drawing (null out of drawer), sent at next pointer message */
  #pointer: (Vector2d & { laser?: boolean }) | null = null;
  /** Laser used by this user, see `setLaser` */
  #laser = false;
  /** Laser trails of other users, by user id */
  #lasers = new Map<string, Trail>();
  /** Messages waiting for live interval */
  #timers: Record<string, ReturnType<typeof setTimeout> | undefined> = {};
  /** Time of last message of each kind (pointer, live), in ms */
  #lastSent: Record<string, number> = {};
  /** Cursors of other users, by user id */
  #cursors = new Map<string, Group>();

  /**
   * Listen to the socket (join on connect, changes, users, pointers) and to the pointer on the stage
   * @param drawer Drawer whose drawing is shared
   * @param socket Socket connected to the collaboration server
   */
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

      const rejoin = this.#joined;

      // before the answer of the server: connected again, drawing of the room merged with changes made meanwhile
      // (`_merge`), not a copy of this one
      this.#connected = true;
      this.#joined = true;
      this.#rejoining = rejoin;
      this.socket.emit(socketEvents.JOIN, { room, name, userId, ownerKey, invitedBy });
      if (rejoin) return;
      // first join: whole drawing sent, merged with other ones of the room
      this.#synced.clear();
      this.send();
    });
    this.socket.on('disconnect', () => {
      this.#connected = false;
    });
    // server identifies this user (logged in account), before sending users of the room
    this.socket.on(socketEvents.JOINED, ({ userId }: { userId?: unknown } = {}) => {
      if (typeof userId === 'string' && userId) this.userId = userId;
    });
    // settings of the room (servers of previous versions: none)
    this.socket.on(socketEvents.ROOM, ({ newUsersCanEdit }: { newUsersCanEdit?: unknown } = {}) => {
      if (typeof newUsersCanEdit !== 'boolean') return;

      this.newUsersCanEdit = newUsersCanEdit;
      this.drawer.trigger(drawerEvents.collaborationChange);
    });
    this.socket.on(socketEvents.CHANGE, (change: DrawingChange) => {
      if (change.full && this.#rejoining) this._rejoin(change);
      else this.receive(change);
    });
    // message refused by the server: room full (session stopped), drawing too big (changes not shared)
    this.socket.on(socketEvents.REJECTED, ({ reason }: { reason?: unknown } = {}) => {
      if (reason === 'full') {
        this.drawer.toast(this.drawer.t('toast.collaborationFull'), 'error');
        this.drawer.stopCollaboration();
      } else if (reason === 'too-big' && Date.now() - this.#tooBigAt > 10_000) {
        this.#tooBigAt = Date.now();
        this.drawer.toast(this.drawer.t('toast.collaborationTooBig'), 'warning');
      }
    });
    // names only from servers without rights
    this.socket.on(socketEvents.USERS, (users: (CollaborationMember | string)[]) => {
      const canEdit = this.canEdit;

      // joined again a server without drawing of the room (`full`, sent before users): whole drawing sent as before
      if (this.#rejoining) {
        this.#rejoining = false;
        this.#synced.clear();
        this.send();
      }

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
    this.drawer.stage.on('pointermove.collaboration', () =>
      this._sendPointer(this.drawer.stage.getRelativePointerPosition())
    );
    this.drawer.stage.on('mouseleave.collaboration', () => this._sendPointer(null));
  }

  /**
   * Send a message after live interval at most (latest state is read when sent)
   * @param key Kind of message (pointer, live): one timer and one last sent time per kind
   * @param send Sends the message, called once the interval elapsed (ignored when one is already waiting)
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

  /**
   * Pointer position in drawing (null: out of drawer) and laser state sent to other users, at live interval at most
   * @param position Pointer position in drawing coordinates (rounded), null when it left the drawer
   */
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
   * @param on Laser pressed (trail shown), false when released
   */
  setLaser(on: boolean) {
    if (this.#laser === on) return;

    this.#laser = on;
    // end told at once, pointer may not move (or be out of canvas)
    this._sendPointer(this.drawer._hasPointer() ? this.drawer._getRelativePointerPos() : null);
  }

  /**
   * Shapes being drawn or moved shown to other users while drawing, final state is sent by `send` on change
   * @param shapes Shapes being drawn or moved (shapes of groups send their whole group)
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
   * @param id Id of the user
   * @returns Color of `cursorColors` picked from the id, the same on every client
   */
  private _color(id: string) {
    return cursorColors[[...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % cursorColors.length];
  }

  /**
   * Cursor of another user in their color: arrow pointing to their position and label of their name
   * @param id Id of the user, gives the color
   * @returns Group of the cursor (not listening), scaled to the zoom, not added to a layer yet
   */
  private _createCursor(id: string) {
    const color = this._color(id);
    const cursor = new Group({ name: 'collaborator-cursor', listening: false });
    const label = new Label({ x: 12, y: 18 });

    // arrow pointing to position
    cursor.add(
      new Line({
        points: [0, 0, 0, 17, 4.5, 13, 7.5, 20, 10, 19, 7, 12, 12.5, 12],
        closed: true,
        fill: color,
        stroke: '#fff',
        strokeWidth: 1.5,
        lineJoin: 'round',
      })
    );
    label.add(new Tag({ fill: color, cornerRadius: 4 }));
    label.add(new Text({ fontFamily: 'system-ui, sans-serif', fontSize: 12, padding: 4, fill: '#fff' }));
    cursor.add(label);
    this._scaleCursor(cursor);

    return cursor;
  }

  /**
   * Cursor scaled by inverse of zoom: same size on screen whatever zoom
   * @param cursor Cursor of another user
   */
  private _scaleCursor(cursor: Group) {
    const scale = 1 / this.drawer.getZoomLevel();

    cursor.scale({ x: scale, y: scale });
  }

  /**
   * Cursors size kept after zoom
   */
  updateCursors() {
    for (const cursor of this.#cursors.values()) this._scaleCursor(cursor);
  }

  /**
   * This user created the room: gives or removes the right to draw
   */
  get isOwner(): boolean {
    // owner secret: known before users list
    return (
      !!this.members.find((member) => member.id === this.userId)?.owner || (!this.members.length && !!this.ownerKey)
    );
  }

  /**
   * This user can draw (given by owner of the room)
   */
  get canEdit(): boolean {
    return this.members.find((member) => member.id === this.userId)?.canEdit ?? true;
  }

  /**
   * Give or remove the right to draw to a user of the room (owner only, checked by server)
   * @param userId Id of the user of the room
   * @param canEdit True to let them draw, false to make them view only
   */
  setRight(userId: string, canEdit: boolean) {
    this.socket.emit(socketEvents.RIGHTS, { userId, canEdit });
  }

  /**
   * Let users coming for the first time draw, or make them view only (owner only, checked by server)
   * @param canEdit True to let them draw, false to make them view only until the owner gives them the right
   */
  setNewUsersCanEdit(canEdit: boolean) {
    this.socket.emit(socketEvents.ROOM, { newUsersCanEdit: canEdit });
  }

  /**
   * Change name shown to other users
   * @param name New name, sent to the server
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
    for (const timer of Object.values(this.#timers)) clearTimeout(timer);
    for (const cursor of this.#cursors.values()) cursor.destroy();
    this.#cursors.clear();
    for (const laser of this.#lasers.values()) laser.destroy();
    this.#lasers.clear();
  }

  /**
   * Send shapes changed since last sync, called on drawer change
   */
  send() {
    // sent once joined again (drawing of the room merged first): not marked synced meanwhile
    if (!this.#connected || this.#rejoining || this.#rejoinDrawing) return;

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
   * @param change Change received from the server (live previews are applied at once)
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
    const rejoinDrawing = this.#rejoinDrawing;

    this.#pending = [];
    this.#rejoinDrawing = null;
    for (const change of pending) this._apply(change);
    // after changes received before the disconnection
    if (rejoinDrawing) this._merge(rejoinDrawing);

    return pending.length > 0 || !!rejoinDrawing;
  }

  /**
   * Joined again after a disconnection: drawing of the room merged with this one, after the current pointer action
   * @param change Whole drawing of the room (`full`)
   */
  private _rejoin(change: DrawingChange) {
    this.#rejoining = false;
    if (this.drawer._duringAction()) {
      this.#rejoinDrawing = change;
      return;
    }

    this._merge(change);
    // saved, added to history, changes made meanwhile sent
    this.drawer.stage.fire('change');
  }

  /**
   * Drawing of the room merged with this one after a disconnection: shapes added or changed here meanwhile are kept
   * (sent next), others take their state in the room, shapes removed by other users meanwhile are removed (unless
   * changed here). A room without drawing (emptied, server restarted) gets the whole drawing again
   * @param change Whole drawing of the room (`full`)
   */
  private _merge({ upsert, order }: DrawingChange) {
    const room = new Map<string, string>();

    for (const json of Array.isArray(upsert) ? upsert : []) {
      const state = parseShapeState(json);

      if (state) room.set(state.attrs.id as string, json);
    }
    if (!room.size) {
      this.#synced.clear();
      return;
    }

    const current = new Map(this.drawer.getDrawingShapes().map((shape) => [shape.id(), serializeShape(shape)]));
    const synced = this.#synced;
    // since last sync: added or changed here, removed here
    const changed = new Set([...current].filter(([id, json]) => synced.get(id) !== json).map(([id]) => id));
    const removed = [...synced.keys()].filter((id) => !current.has(id));

    this._apply({
      upsert: [...room].filter(([id]) => !changed.has(id) && !removed.includes(id)).map(([, json]) => json),
      remove: [...current.keys()].filter((id) => !room.has(id) && !changed.has(id)),
      ...(Array.isArray(order) && { order }),
    });
    // sent next: changes made here as new ones, removals of shapes still in the room
    for (const id of changed) this.#synced.delete(id);
    for (const id of removed) if (room.has(id)) this.#synced.set(id, room.get(id)!);
  }

  /**
   * Apply a change of another client: shapes removed, updated (groups replaced, selection kept) or added, stacking
   * order applied. Shapes are recorded as synced, so the change is not sent back. Only drawing shapes are created, as
   * from files: other nodes (stage, layers...) and invalid shapes are ignored
   */
  private _apply({ upsert, remove, order }: DrawingChange) {
    const shapes = new Map(this.drawer.getDrawingShapes().map((shape) => [shape.id(), shape]));

    for (const id of Array.isArray(remove) ? remove : []) {
      shapes.get(id)?.destroy();
      this.#synced.delete(id);
    }

    for (const json of Array.isArray(upsert) ? upsert : []) {
      const state = parseShapeState(json);

      if (!state) {
        console.warn('Shape of another user ignored: not a drawing shape');
        continue;
      }

      const { attrs, className } = state as { attrs: ShapeConfig; className: string };
      let shape = shapes.get(attrs.id as string);

      // groups replaced with their shapes, at same place, still selected
      if (shape && (shape instanceof Group || className === 'Group')) {
        const index = shape.zIndex();
        const selected = this.drawer.getSelectedShapes();

        shape.destroy();
        shape = this.drawer.addShape(Node.create(state) as DrawingShape);
        shape.zIndex(index);
        if (selected.some((node) => !node.getLayer())) {
          this.drawer
            .getWidget<SelectWidget>('selection')
            ?.select([...selected.filter((node) => node.getLayer()), shape]);
        }
      } else if (shape) {
        // same node (kept in selection): attributes removed by other client are removed, not local ones (draggable,
        // hit function)
        const node: Node = shape;
        const removed = Object.keys(node.attrs).filter(
          (key) => !(key in attrs) && key !== 'draggable' && typeof node.getAttr(key) !== 'function'
        );

        for (const key of removed) node.setAttr(key, undefined);
        shape.setAttrs(attrs);
      } else {
        shape = this.drawer.addShape(Node.create(state) as DrawingShape);
      }
      // as serialized here, not to send it back
      this.#synced.set(shape.id(), serializeShape(shape));
    }

    if (Array.isArray(order)) {
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
    if (transformer && Array.isArray(remove) && remove.length)
      transformer.nodes(transformer.nodes().filter((node) => node.getLayer()));
  }
}
