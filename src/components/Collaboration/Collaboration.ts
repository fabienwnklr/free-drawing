import type { Drawer } from '@/Drawer';
import type { Socket } from 'socket.io-client';
import { Node } from 'konva/lib/Node';
import type { Shape, ShapeConfig } from 'konva/lib/Shape';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { serializeShape } from '@/components/tools/UndoRedo/History';
import { socketEvents } from '@/constants';

/**
 * Drawing change sent to other clients: shapes added or updated (konva JSON), ids of removed shapes
 */
export type DrawingChange = { upsert: string[]; remove: string[] };

export type CollaborationSocket = Pick<Socket, 'on' | 'once' | 'emit' | 'disconnect'>;

/**
 * Real time collaboration in a room: changes of drawing (any tool, undo...) are sent shape by shape to other users
 * of the room, through a socket.io server (see server/index.mjs), so concurrent drawings are merged
 */
export class Collaboration {
  readonly socket: CollaborationSocket;
  readonly room: string;
  /** Name shown to other users */
  name: string;
  /** Names of users of the room, this one included */
  users: string[] = [];
  private readonly drawer: Drawer;
  /** Shapes as other clients know them, by id */
  #synced = new Map<string, string>();
  /** Changes received during a pointer action of this client, applied when it ends */
  #pending: DrawingChange[] = [];

  constructor(drawer: Drawer, socket: CollaborationSocket, { room, name }: { room: string; name: string }) {
    this.drawer = drawer;
    this.socket = socket;
    this.room = room;
    this.name = name;

    this.socket.on('connect', () => {
      if (this.drawer.debug) console.log('🌍 Connected to collaboration server');
      this.socket.emit(socketEvents.JOIN, { room: this.room, name: this.name });
      // (re)connected: whole drawing sent, merged with other ones of the room
      this.#synced.clear();
      this.send();
    });
    this.socket.on(socketEvents.CHANGE, (change: DrawingChange) => this.receive(change));
    this.socket.on(socketEvents.USERS, (users: string[]) => {
      this.users = users;
      this.drawer.trigger('fd.collaboration.change');
    });
  }

  /**
   * Change name shown to other users
   */
  setName(name: string) {
    this.name = name;
    this.socket.emit(socketEvents.NAME, name);
  }

  /**
   * Leave room
   */
  stop() {
    this.socket.disconnect();
  }

  /**
   * Send shapes changed since last sync, called on drawer change
   */
  send() {
    const current = new Map(this.drawer.getDrawingShapes().map((shape) => [shape.id(), serializeShape(shape)]));
    const upsert = [...current].filter(([id, json]) => this.#synced.get(id) !== json).map(([, json]) => json);
    const remove = [...this.#synced.keys()].filter((id) => !current.has(id));

    this.#synced = current;
    if (upsert.length || remove.length) this.socket.emit(socketEvents.CHANGE, { upsert, remove } satisfies DrawingChange);
  }

  /**
   * Apply change of another client, after current pointer action (not to alter shape being drawn)
   */
  receive(change: DrawingChange) {
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

  private _apply({ upsert, remove }: DrawingChange) {
    const shapes = new Map(this.drawer.getDrawingShapes().map((shape) => [shape.id(), shape]));

    remove.forEach((id) => {
      shapes.get(id)?.destroy();
      this.#synced.delete(id);
    });

    upsert.forEach((json) => {
      const { attrs } = JSON.parse(json) as { attrs: ShapeConfig };
      let shape = shapes.get(attrs.id as string);

      if (shape) {
        // same node (kept in selection): attributes removed by other client are removed
        Object.keys(shape.attrs)
          .filter((key) => !(key in attrs) && key !== 'draggable')
          .forEach((key) => shape!.setAttr(key, undefined));
        shape.setAttrs(attrs);
      } else {
        shape = this.drawer.addShape(Node.create(json) as Shape<ShapeConfig>);
      }
      // as serialized here, not to send it back
      this.#synced.set(shape.id(), serializeShape(shape));
    });

    // removed shapes are not selected anymore
    const transformer = this.drawer.getWidget<SelectWidget>('selection')?.transformer;
    if (transformer && remove.length) transformer.nodes(transformer.nodes().filter((node) => node.getLayer()));
  }
}
