import type { Drawer } from '@/Drawer';
import { Node } from 'konva/lib/Node';
import type { Trail } from '@/components/toolbar/widgets/Eraser/Trail';
import { createLaserTrail } from '@/components/toolbar/widgets/Laser/Laser';
import type { Vector2d } from 'konva/lib/types';
import { Container } from 'konva/lib/Container';
import { Group } from 'konva/lib/Group';
import { Line } from 'konva/lib/shapes/Line';
import { Label, Tag } from 'konva/lib/shapes/Label';
import { Text } from 'konva/lib/shapes/Text';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { mergeState, serializeShape } from '@/components/tools/UndoRedo/History';
import { drawerEvents } from '@/constants';
import { maxMessageSize, socketEvents } from '@free-drawing/protocol';
import { applyOrder } from '@/utils/order';
import { parseShapeState } from '@/utils/drawingFile';
import { getFileIds, parseFiles } from '@/utils/image';
import { decryptChange, encryptChange, type RoomCipher } from '@/utils/encryption';
import type { ColorLike, DrawingShape } from '@/@types/drawer';
import type { TranslationKey } from '@/@types/i18n';
import type { ShapeState } from '@/@types/file';
import type {
  DrawingChange,
  EncryptedChange,
  EncryptedMessage,
  RemotePointer,
  CollaborationSocket,
  CollaborationMember,
  CollaborationSession,
  ChangePart,
  UnconfirmedPart,
  ShapeMerge,
  ChangeAcknowledgement,
  PointerPosition,
  JoinedMessage,
  RoomMessage,
  RejectedMessage,
  RequestMessage,
  AccessRequest,
  PresentedView,
} from '@/@types/collaboration';

/** Minimum interval of pointer and live drawing messages (ms) */
const liveInterval = 50;

const cursorColors = ['#e03131', '#2f9e44', '#1971c2', '#f08c00', '#9c36b5', '#0c8599', '#c2255c'];

/** Rooms whose shapes are kept in browser (`_keepSynced`): the ones used last */
const keptRooms = 5;

/**
 * Time a lost connection takes to be seen at most (ms): ping interval and timeout of socket.io servers (45 s by
 * default), and a margin. Changes sent then and not acknowledged may be lost (servers of previous versions acknowledge
 * none)
 */
const lossWindow = 60_000;

/**
 * Hash of a text (cyrb53, 53 bits): a shape known again without keeping its JSON
 * @param text JSON of a shape
 * @returns Hash in base 36
 */
const hashText = (text: string) => {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);

    h1 = Math.imul(h1 ^ char, 2654435761);
    h2 = Math.imul(h2 ^ char, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
};

/**
 * Background color of another user or of the room, checked on reception (any color, as in files)
 * @param background Color received
 * @returns The color, null when missing or invalid
 */
const checkBackground = (background: unknown): ColorLike | null =>
  typeof background === 'string' && background.length > 0 && background.length <= 100
    ? (background as ColorLike)
    : null;

/**
 * Area presented by the owner, checked on reception
 * @param view Message of the server: area (of a slide with `slide`), or null when the presentation stops
 * @returns Area with finite coordinates and a positive size, null, or undefined when invalid (ignored)
 */
const checkView = (view: unknown): PresentedView | null | undefined => {
  if (view === null) return null;

  const { x, y, width, height, slide } = (typeof view === 'object' ? view : {}) as Record<string, unknown>;

  if (![x, y, width, height].every(Number.isFinite) || (width as number) <= 0 || (height as number) <= 0) return;

  return { x, y, width, height, ...(slide === true && { slide }) } as PresentedView;
};

/**
 * Pointer position of another user in an encrypted room, checked once decrypted (the server can't check it)
 * @param pointer Decrypted position, null out of the drawer
 * @returns Position with finite coordinates, null, or undefined when invalid (ignored)
 */
const checkPointer = (pointer: unknown): PointerPosition | null | undefined => {
  if (pointer === null) return null;

  const { x, y, laser } = (typeof pointer === 'object' ? pointer : {}) as Record<string, unknown>;

  if (!Number.isFinite(x) || !Number.isFinite(y)) return;

  return { x: x as number, y: y as number, ...(laser === true && { laser }) };
};

/**
 * Real time collaboration in a room: changes of drawing (any tool, undo...) are sent shape by shape to other users
 * of the room, through a socket.io server (see apps/server), so concurrent drawings are merged
 */
export class Collaboration {
  /** Largest message sent to the server (bytes), a bigger one would close the connection: `maxMessageSize` of the protocol */
  static maxMessageSize = maxMessageSize;
  /** Time before a change refused beyond the rate of messages of the server is sent again (ms), lowered by tests */
  static retryDelay = 1000;
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
  /** Users coming for the first time can draw (setting of the owner), else they view only (by default) */
  newUsersCanEdit = false;
  /** This user (owner) presents their view: other users follow it, see `present` */
  presenting = false;
  /** Area shown by the owner presenting it, null without presentation */
  presentedView: PresentedView | null = null;
  /** This user follows the presented view: stops when they move or zoom theirs, see `follow` */
  following = true;
  /** This user (viewer) asked for the right to draw, waiting for the answer of the owner */
  requested = false;
  /** Viewers asking the owner (this user) for the right to draw, waiting for its answer */
  requests: AccessRequest[] = [];
  /** Id of this user: given by drawer, then by server when it joins (e.g. id of logged in account) */
  userId: string;
  /** Secret of the browser of this user, sent on join with its id: nobody else gets this id from the server */
  readonly userKey?: string;
  /** Secret of the owner of the room, sent on join: the server makes this user its owner */
  readonly ownerKey?: string;
  /** Id of the user who shared the link used to join, sent on join (the server gives their name to the owner) */
  readonly invitedBy?: string;
  /**
   * Encryption of an encrypted room (key of its links): shapes, image files, background, pointers and views are
   * encrypted before they are sent, the server never reads them; null for a room in clear
   */
  readonly cipher: RoomCipher | null;
  /** Drawer whose drawing is shared */
  private readonly drawer: Drawer;
  /** Messages of an encrypted room being encrypted or decrypted (asynchronous): next ones sent or handled after them */
  #queue: Promise<void> | null = null;
  /** Connections to the server so far: a message encrypted during a lost connection is not sent */
  #connection = 0;
  /** Session stopped: messages decrypted afterwards are ignored */
  #stopped = false;
  /** Shapes as other clients know them, by id, in stacking order */
  #synced = new Map<string, string>();
  /** Shapes known by the room changed since they were kept in browser (`_keepSynced`) */
  #syncChanged = false;
  /**
   * First join: shapes known by the room in a previous visit of this browser (hashes of their JSON by id, see
   * `_keepSynced`), until the drawing of the room is merged
   */
  #restored: Map<string, string> | null = null;
  /**
   * Image files the room has (sent or received): a file is sent once, with the first shape using it, again once it was
   * no longer used (the room may forget it)
   */
  #sentFiles = new Set<string>();
  /** Shapes (their JSON) and image files (empty) too big for a message alone, by id: not sent again until changed */
  #tooBig = new Map<string, string>();
  /**
   * Background color as other clients know it: null until the one of the room is received (a joining user does not
   * impose theirs), empty when the room has none (this one sent)
   */
  #syncedBackground: string | null = null;
  /** Time of the last warning of a change refused by the server (drawing too big), shown again after a while */
  #tooBigAt = 0;
  /**
   * Changes received during a pointer action of this client, applied in order when it ends: the drawing of the room
   * received again after a reconnection (`rejoin`) is merged at its place; groups and frames changed by changes of this
   * user not acknowledged when they came are merged from their state known by the room before them (`bases`)
   */
  #pending: [change: DrawingChange, rejoin: boolean, bases?: Map<string, string>][] = [];
  /** Connected to the server: changes made while disconnected are sent once joined again */
  #connected = false;
  /** Joined the room before: a reconnection merges the drawing of the room with changes made meanwhile */
  #joined = false;
  /** Joined (first time or again), drawing of the room awaited: nothing sent meanwhile */
  #rejoining = false;
  /** Drawing of the room received again during a pointer action of this client, merged when it ends: nothing sent before */
  #rejoinPending = false;
  /** Parts of changes sent on this connection, not acknowledged by the server yet */
  #unconfirmed = new Set<UnconfirmedPart>();
  /**
   * Server acknowledges changes (servers of previous versions: none): a change of another user received before the
   * acknowledgement of a change of this user was applied before it by the server
   */
  #acknowledging = false;
  /** Stacking order sent and lost with the connection: the one of this user kept by the merge, sent again */
  #orderLost = false;
  /**
   * Shapes of changes of others left out for changes of this user not acknowledged yet (`_withoutUnconfirmed`), by id:
   * JSON received, null for a removal; applied if the change of this user is refused (the version of the room)
   */
  #leftOut = new Map<string, string | null>();
  /**
   * Shapes of changes refused by the server (drawing too big, right to draw removed meanwhile), by id: JSON here when
   * refused (empty: removed here). Changes of others received later are applied to them while they are not changed
   * here (the version of the room), else they are sent again
   */
  #refused = new Map<string, string>();
  /** Shapes being drawn or moved, sent at next live message */
  #live = new Set<DrawingShape>();
  /** Ids of shapes sent as live previews since the last final change: removed for everyone if they are discarded */
  #sentLive = new Set<string>();
  /** Last pointer position of this user in drawing (null out of drawer), sent at next pointer message */
  #pointer: PointerPosition | null = null;
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
  /** View moved to the presented one: not a move of this user */
  #showingView = false;

  /**
   * Listen to the socket (join on connect, changes, users, pointers) and to the pointer on the stage
   * @param drawer Drawer whose drawing is shared
   * @param socket Socket connected to the collaboration server
   */
  constructor(
    drawer: Drawer,
    socket: CollaborationSocket,
    { room, name, userId = '', userKey, ownerKey, invitedBy, cipher }: CollaborationSession
  ) {
    this.drawer = drawer;
    this.socket = socket;
    this.room = room;
    this.name = name;
    this.userId = userId;
    this.userKey = userKey;
    this.ownerKey = ownerKey;
    this.invitedBy = invitedBy;
    this.cipher = cipher ?? null;

    this.socket.on('connect', () => {
      if (this.#stopped) return;
      if (this.drawer.debug) console.log('🌍 Connected to collaboration server');
      const { room, name, userId, userKey, ownerKey, invitedBy } = this;

      const rejoin = this.#joined;

      // before the answer of the server: nothing sent until the drawing of the room is received and merged with this
      // one (`_merge`), not overwritten by a copy of it (page reloaded, changes made while disconnected)
      this.#connection++;
      this.#connected = true;
      this.#joined = true;
      this.#rejoining = true;
      if (!rejoin) {
        // first join: background of the room received first (a joining user does not impose theirs), drawing known by
        // the room in a previous visit of this browser
        this.#syncedBackground = null;
        this.#synced.clear();
        this.#sentFiles.clear();
        this.#restored = this._readSynced();
      }
      // encrypted room: proof of its key, users with another key (or none) are refused
      this.socket.emit(socketEvents.JOIN, {
        room,
        name,
        userId,
        userKey,
        ownerKey,
        invitedBy,
        ...(this.cipher && { keyCheck: this.cipher.keyCheck }),
      });
      // presentation going on after a reconnection
      if (this.presenting) this._sendView();
      if (rejoin) {
        // request forgotten by the server with the connection: asked again
        if (this.requested) this.socket.emit(socketEvents.REQUEST);
        // users who left meanwhile: no cursor (others shown again as they move)
        this._removeCursors();
      }
    });
    this.socket.on('disconnect', () => {
      this.#connection++;
      this.#connected = false;
      this._unconfirm();
    });
    // server identifies this user (logged in account), before sending users of the room
    this._listen(socketEvents.JOINED, ({ userId }: JoinedMessage = {}) => {
      if (typeof userId === 'string' && userId) this.userId = userId;
    });
    // settings of the room (servers of previous versions: none)
    this._listen(socketEvents.ROOM, ({ newUsersCanEdit, encrypted }: RoomMessage = {}) => {
      // server of previous versions: refuses encrypted changes
      if (this.cipher && encrypted !== true) {
        this._stopWith('error.encryptionUnsupported');
        return;
      }
      if (typeof newUsersCanEdit !== 'boolean') return;

      this.newUsersCanEdit = newUsersCanEdit;
      this.drawer.trigger(drawerEvents.collaborationChange);
    });
    this._listen(socketEvents.CHANGE, (message: unknown) => {
      if (!this.cipher) return this._onChange(message as DrawingChange);

      return decryptChange(this.cipher, message).then(({ change, failed }) => {
        if (failed) console.warn(`${failed} parts of a change ignored: not encrypted with the key of the room`);
        if (!this.#stopped) this._onChange(change);
      });
    });
    // message refused by the server: room full (session stopped), drawing too big (changes not shared), change made
    // without right to draw (sent again once allowed), key of an encrypted room missing or wrong (session stopped)
    this._listen(socketEvents.REJECTED, ({ reason, upsert, remove }: RejectedMessage = {}) => {
      if (reason === 'full') {
        this.drawer.toast(this.drawer.t('toast.collaborationFull'), 'error');
        this.drawer.stopCollaboration();
      } else if (reason === 'too-big' || reason === 'right') {
        if (reason === 'too-big') this._tellTooBig();
        this._refuse(upsert, remove);
      } else if (reason === 'key') {
        this._stopWith('error.roomKey');
      }
    });
    // names only from servers without rights
    this._listen(socketEvents.USERS, (users: (CollaborationMember | string)[]) => {
      const canEdit = this.canEdit;
      // first users of the room: right of this user known now (view only by default)
      const joined = !this.members.length;

      // joined a server without drawing of the room (`full`, sent before users): whole drawing sent as before
      if (this.#rejoining) {
        this.#rejoining = false;
        this.#restored = null;
        this.#synced.clear();
        this.#sentFiles.clear();
        this.send();
      }

      const ids = new Set<string>();

      this.members = users
        .map((user) => (typeof user === 'string' ? { id: '', name: user, owner: false, canEdit: true } : user))
        // a user in several tabs once
        .filter(({ id }) => !id || (!ids.has(id) && !!ids.add(id)));
      this.users = this.members.map((member) => member.name);
      // requests answered: users gone or allowed to draw since
      this.requests = this.requests.filter(({ userId }) =>
        this.members.some((member) => member.id === userId && !member.canEdit)
      );
      if (this.canEdit) this.requested = false;
      if (this.canEdit !== canEdit) {
        this.drawer._onCollaborationRight(this.canEdit, joined);
        // changes kept while viewing (refused by the server)
        if (this.canEdit) this.send();
      }
      this.drawer.trigger(drawerEvents.collaborationChange);
    });
    this._listen(socketEvents.POINTER, (pointer: RemotePointer) => {
      if (!this.cipher) return this._showCursor(pointer);

      return this.cipher.decryptJson(pointer?.data).then(
        (position) => {
          const checked = checkPointer(position);

          if (checked !== undefined && !this.#stopped) this._showCursor({ ...pointer, position: checked });
        },
        () => console.warn('Pointer of another user ignored: not encrypted with the key of the room')
      );
    });
    this._listen(socketEvents.VIEW, (view: unknown) => {
      // presentation stopped: in clear
      if (!this.cipher || view === null) return this._receiveView(view);

      return this.cipher.decryptJson((view as Partial<EncryptedMessage> | undefined)?.data).then(
        (area) => {
          if (!this.#stopped) this._receiveView(area);
        },
        () => console.warn('View of the owner ignored: not encrypted with the key of the room')
      );
    });
    this._listen(socketEvents.REQUEST, (message: RequestMessage = {}) => this._receiveRequest(message));
    this._listen(socketEvents.LEAVE, (id: string) => {
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
    // drawer resized: presented view sent again, or followed in the new size
    this.drawer.stage.on('widthChange.collaboration heightChange.collaboration', () => {
      if (this.presenting) this._sendView();
      else if (this.presentedView && this.following) this._showView();
    });
  }

  /**
   * Operation run in order with the messages of the room: at once, unless messages of an encrypted room are being
   * encrypted or decrypted (asynchronous), then after them, so messages are sent and handled in the order they come
   * (whole drawing of the room before its users...). Nothing runs once the session is stopped
   * @param operation Sends or handles a message, returns a promise while it encrypts or decrypts
   */
  private _inOrder(operation: () => Promise<void> | void) {
    let queue: Promise<void>;

    if (this.#stopped) return;
    if (this.#queue) {
      queue = this.#queue.then(() => (this.#stopped ? undefined : operation()));
    } else {
      const result = operation();

      if (!result) return;
      queue = result;
    }
    // an error does not stop the next operations
    this.#queue = queue = queue
      .catch((error) => console.error(error))
      .then(() => {
        if (this.#queue === queue) this.#queue = null;
      });
  }

  /**
   * Messages of an event of the server handled in order (see `_inOrder`)
   * @param event Event of the server
   * @param handle Handles a message, returns a promise while it decrypts it
   */
  private _listen<T>(event: string, handle: (message: T) => Promise<void> | void) {
    this.socket.on(event, (message: T) => this._inOrder(() => handle(message)));
  }

  /**
   * Session stopped by an error told in a toast (key of the room, server)
   * @param error Key of the text of the error
   */
  private _stopWith(error: TranslationKey) {
    this.drawer.toast(this.drawer.t('toast.collaborationUnavailable', { error: this.drawer.t(error) }), 'error');
    this.drawer.stopCollaboration();
  }

  /**
   * Position or view sent to the server: encrypted in an encrypted room (`{ data }`, sent once encrypted unless the
   * connection was lost meanwhile), as it is in a room in clear
   * @param event `POINTER` or `VIEW`
   * @param value Pointer position (null out of the drawer), area of the view
   * @param volatile Dropped rather than delayed when the connection is slow
   * @returns Promise while it is encrypted
   */
  private _emitData(event: string, value: unknown, volatile = false): Promise<void> | void {
    if (!this.cipher) {
      (volatile ? this.socket.volatile : this.socket).emit(event, value);
      return;
    }

    const connection = this.#connection;

    return this.cipher.encryptJson(value).then((data) => {
      if (connection !== this.#connection || this.#stopped) return;
      // `volatile` read when sent: it marks the next message
      (volatile ? this.socket.volatile : this.socket).emit(event, { data } satisfies EncryptedMessage);
    });
  }

  /**
   * Change sent to the server (encrypted in an encrypted room), unless too big for it: nothing is marked as sent then
   * @param change Change to send
   * @param sent Marks its content as known by the room, called just before it is sent
   * @param volatile Live preview: dropped rather than delayed when the connection is slow
   * @param tooBig Called when it is not sent, too big for the server
   * @param acknowledged Called once the server received it with its answer (refusal beyond its rate; servers of
   * previous versions: never called)
   * @returns Promise while it is encrypted (sent unless the connection was lost meanwhile)
   */
  private _emitChange(
    change: DrawingChange,
    sent: () => void,
    volatile = false,
    tooBig?: () => void,
    acknowledged?: (answer: ChangeAcknowledgement) => void
  ): Promise<void> | void {
    const emit = (message: DrawingChange | EncryptedChange) => {
      if (!this._fits(message)) return tooBig?.();
      sent();

      const socket = volatile ? this.socket.volatile : this.socket;

      if (acknowledged) socket.emit(socketEvents.CHANGE, message, acknowledged);
      else socket.emit(socketEvents.CHANGE, message);
    };

    if (!this.cipher) return emit(change);

    const connection = this.#connection;

    return encryptChange(this.cipher, change).then((message) => {
      if (connection === this.#connection && !this.#stopped) emit(message);
    });
  }

  /**
   * Change of another user (decrypted in an encrypted room): whole drawing of the room merged after a reconnection,
   * else applied
   * @param change Change received from the server
   */
  private _onChange(change: DrawingChange) {
    if (change.full && this.#rejoining) this._rejoin(change);
    else this.receive(change);
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
    this._schedule('pointer', () => this._inOrder(() => this._emitData(socketEvents.POINTER, this.#pointer, true)));
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
   * Shapes being drawn or moved shown to other users while drawing, final state is sent by `send` on change. Not
   * before the drawing of the room is merged (joining again): a preview would make the room keep it as its drawing
   * @param shapes Shapes being drawn or moved (shapes of groups send their whole group)
   */
  sendLive(shapes: DrawingShape[]) {
    // shapes of groups and of frames: whole group or frame (top node), found by their parents (a big selection)
    const tops = new Set<Node>(this.drawer.getDrawingShapes());

    for (const shape of shapes) {
      let node: Node | null = shape;

      while (node && !tops.has(node)) node = node.getParent();
      if (node) this.#live.add(node as DrawingShape);
    }
    this._schedule('live', () =>
      this._inOrder(() => {
        const shapes = [...this.#live].filter((shape) => shape.getLayer());

        this.#live.clear();
        if (!shapes.length || !this.#connected || this.#rejoining || this.#rejoinPending) return;

        return this._emitChange(
          { upsert: shapes.map(serializeShape), remove: [], live: true },
          () => {
            for (const shape of shapes) this.#sentLive.add(shape.id());
          },
          true
        );
      })
    );
  }

  /**
   * Shape being drawn discarded (simple click: nothing drawn): its live preview, if sent, is removed for everyone (the
   * server keeps previews in the drawing of the room)
   * @param shape Shape removed from the drawing without change
   */
  discardLive(shape: DrawingShape) {
    const id = shape.id();

    this.#live.delete(shape);
    // after a preview being encrypted; disconnected or joining again: removed once the drawing of the room is merged
    // (`_merge`, `_send`)
    this._inOrder(() => {
      if (this.#connected && !this.#rejoining && !this.#rejoinPending && this.#sentLive.delete(id)) {
        this.socket.emit(socketEvents.CHANGE, { upsert: [], remove: [id] } satisfies DrawingChange);
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
   * Present the view of this user (owner): other users follow its zoom and moves, until they move theirs
   * @param on True to present, false to stop
   */
  present(on: boolean) {
    if (this.presenting === on || (on && !this.isOwner)) return;

    this.presenting = on;
    if (on) this._sendView();
    else {
      // after a view being encrypted
      this._inOrder(() => {
        this.socket.emit(socketEvents.VIEW, null);
      });
    }
    this.drawer.trigger(drawerEvents.collaborationChange);
  }

  /**
   * View of the presenting owner sent to other users, at live interval at most (latest view when sent): the slide shown
   * during a slideshow (seen alone), else its view
   */
  private _sendView() {
    this._schedule('view', () =>
      this._inOrder(() => {
        if (!this.presenting) return;

        const slide = this.drawer.slideshow.getSlideArea();
        const view: PresentedView = slide ? { ...slide, slide: true } : this.drawer.getViewArea();

        return this._emitData(socketEvents.VIEW, view);
      })
    );
  }

  /**
   * View moved or zoomed (`Drawer._update`): sent while presenting it, moved by this user while following a
   * presentation: no longer followed (`follow` again)
   */
  onViewChange() {
    if (this.presenting) {
      this._sendView();
    } else if (this.presentedView && this.following && !this.#showingView) {
      this.following = false;
      // slide no longer seen alone
      this.drawer.slideshow.hideSlideArea();
      this.drawer.trigger(drawerEvents.collaborationChange);
    }
  }

  /**
   * Follow the presented view again, after moving or zooming theirs
   */
  follow() {
    if (!this.presentedView) return;

    this.following = true;
    this._showView();
    this.drawer.trigger(drawerEvents.collaborationChange);
  }

  /**
   * Presented area shown in the view of this user (not a move of theirs): a slide alone (around it masked)
   */
  private _showView() {
    const view = this.presentedView;

    if (!view) return;

    this.#showingView = true;
    if (view.slide) {
      this.drawer.slideshow.showSlideArea(view);
    } else {
      this.drawer.slideshow.hideSlideArea();
      this.drawer.showArea(view);
    }
    this.#showingView = false;
  }

  /**
   * View of the owner presenting it: followed (unless this user moved theirs), told when a presentation starts or stops
   * @param message Area shown by the owner, null when the presentation stops (other values ignored)
   */
  private _receiveView(message: unknown) {
    const view = checkView(message);

    // the owner does not follow itself (other connection of theirs)
    if (view === undefined || this.isOwner) return;

    const { drawer } = this;
    const presented = !!this.presentedView;

    this.presentedView = view;
    // presentation started or stopped: followed by default
    if (presented !== !!view) {
      const owner = this.members.find((member) => member.owner)?.name || drawer.t('collab.anonymous');

      this.following = true;
      drawer.toast(drawer.t(view ? 'toast.presentationStarted' : 'toast.presentationEnded', { name: owner }), 'info');
      drawer.trigger(drawerEvents.collaborationChange);
    }
    // stopped: slide no longer seen alone
    if (!view) drawer.slideshow.hideSlideArea();
    if (this.following) this._showView();
  }

  /**
   * Ask the owner for the right to draw (viewer), once until it answers
   */
  requestEdit() {
    if (this.canEdit || this.requested) return;

    this.requested = true;
    this.socket.emit(socketEvents.REQUEST);
    this.drawer.toast(this.drawer.t('toast.requestSent'), 'info');
    this.drawer.trigger(drawerEvents.collaborationChange);
  }

  /**
   * Answer the request of a viewer (owner): accepted gives them the right to draw, a refusal is told to them
   * @param userId Id of the user asking
   * @param accepted True to let them draw
   */
  answerRequest(userId: string, accepted: boolean) {
    this.requests = this.requests.filter((request) => request.userId !== userId);
    this.socket.emit(socketEvents.REQUEST, { userId, accepted });
    this.drawer.trigger(drawerEvents.collaborationChange);
  }

  /**
   * Request of a viewer (owner: told in a toast, answered from the panel of the session), or refusal of the request of
   * this user
   * @param message Request (`userId`, `name`) or answer (`accepted`), checked
   */
  private _receiveRequest({ userId, name, accepted }: RequestMessage) {
    const { drawer } = this;

    if (this.isOwner) {
      if (typeof userId !== 'string' || !userId || this.requests.some((request) => request.userId === userId)) return;

      const userName = typeof name === 'string' && name ? name : drawer.t('collab.anonymous');

      this.requests.push({ userId, name: userName });
      drawer.toast(drawer.t('toast.requestReceived', { name: userName }), 'info');
    } else if (accepted === false && this.requested) {
      this.requested = false;
      drawer.toast(drawer.t('toast.requestRefused'), 'warning');
    } else {
      return;
    }
    drawer.trigger(drawerEvents.collaborationChange);
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
    this.#stopped = true;
    this.socket.disconnect();
    this.drawer.stage.off('.collaboration');
    for (const timer of Object.values(this.#timers)) clearTimeout(timer);
    this._removeCursors();
    // slide of the owner no longer seen alone
    if (this.presentedView?.slide) this.drawer.slideshow.hideSlideArea();
  }

  /**
   * Cursors and laser trails of other users removed
   */
  private _removeCursors() {
    for (const cursor of this.#cursors.values()) cursor.destroy();
    this.#cursors.clear();
    for (const laser of this.#lasers.values()) laser.destroy();
    this.#lasers.clear();
  }

  /**
   * Send shapes changed since last sync, called on drawer change (in an encrypted room, after the messages being
   * encrypted or decrypted: changes found then)
   */
  send() {
    this._inOrder(() => this._send());
  }

  /**
   * Shapes changed since last sync sent, see `send`
   * @returns Promise while the change is encrypted
   */
  private _send(): Promise<void> | void {
    // sent once joined (drawing of the room merged first): not marked synced meanwhile
    if (!this.#connected || this.#rejoining || this.#rejoinPending) return;
    // viewer: refused by the server, sent once allowed to draw
    if (!this.canEdit) return this._keepSynced();

    const shapes = this.drawer.getDrawingShapes();
    // found once per change (also read by history)
    const current = this.drawer._shapeStates();
    const since = Date.now() - lossWindow;

    // received by servers of previous versions (no acknowledgement) once a lost connection would have been seen
    for (const part of this.#unconfirmed) if (part.at < since) this.#unconfirmed.delete(part);
    const synced = this.#synced;
    // changed since last sync, except shapes too big for a message (tried again once changed)
    const upserted = shapes.filter((shape) => {
      const json = current.get(shape.id());

      return synced.get(shape.id()) !== json && this.#tooBig.get(shape.id()) !== json;
    });
    // also previews of shapes removed before their final change
    const remove = [...new Set([...synced.keys(), ...this.#sentLive])].filter((id) => !current.has(id));
    const ids = [...current.keys()];
    const added = ids.filter((id) => !synced.has(id));
    // stacking order of known shapes changed (reorder, undo...), or new shapes not on top (group, ungroup...):
    // new shapes are added on top by others
    const reordered =
      ids.filter((id) => synced.has(id)).join() !== [...synced.keys()].filter((id) => current.has(id)).join() ||
      added.join() !== ids.slice(ids.length - added.length).join();
    const background = this.drawer.background.fill() as string;
    // changed here, once the background of the room is known (a color the server accepts)
    const recolored =
      this.#syncedBackground !== null && background !== this.#syncedBackground && checkBackground(background) !== null;
    // image files no longer used: the room may forget them, sent again when used again
    const used = new Set(getFileIds(shapes));

    for (const id of this.#sentFiles) if (!used.has(id)) this.#sentFiles.delete(id);
    for (const id of this.#tooBig.keys()) if (!current.has(id) && !used.has(id)) this.#tooBig.delete(id);

    const parts = this._split(upserted, current, remove, reordered && ids, recolored ? background : undefined, used);
    // stacking order sent (or unchanged): known in this order
    let ordered = !reordered;
    const mark = ({ change, ids }: ChangePart) => {
      for (const id of ids) {
        synced.set(id, current.get(id)!);
        this.#refused.delete(id);
      }
      for (const id of change.remove) synced.delete(id);
      for (const id of Object.keys(change.files ?? {})) this.#sentFiles.add(id);
      if (change.background !== undefined) this.#syncedBackground = change.background;
      if (change.order) ordered = true;
    };
    const finish = () => {
      // in stacking order, removals not sent yet after
      if (ordered) {
        this.#synced = new Map([
          ...ids.filter((id) => synced.has(id)).map((id): [string, string] => [id, synced.get(id)!]),
          ...[...synced].filter(([id]) => !current.has(id)),
        ]);
      }
      // final state sent, previews useless
      this.#live.clear();
      this.#sentLive.clear();
      if (parts.length) this.#syncChanged = true;
      this._keepSynced();
    };
    // one after the other (encrypted ones once encrypted), a part too big skipped: shapes and files not marked synced
    const emit = (index: number): Promise<void> | void => {
      for (let i = index; i < parts.length; i++) {
        const part = parts[i];
        const { change } = part;
        // known by the room once acknowledged: unsynced if the connection is lost before
        const unconfirmed: UnconfirmedPart = {
          upsert: part.ids,
          remove: change.remove,
          files: Object.keys(change.files ?? {}),
          background: change.background !== undefined,
          order: !!change.order,
          at: 0,
          before: new Map(),
        };
        const result = this._emitChange(
          change,
          () => {
            // known by the room before: groups and frames changed meanwhile by others are merged from it
            for (const id of part.ids) if (synced.get(id)) unconfirmed.before.set(id, synced.get(id)!);
            mark(part);
            unconfirmed.at = Date.now();
            this.#unconfirmed.add(unconfirmed);
          },
          false,
          () => {
            // a shape or a file alone too big: not tried again until changed
            if (part.ids.length + unconfirmed.files.length !== 1) return;

            const id = part.ids[0] ?? unconfirmed.files[0];

            this.#tooBig.set(id, current.get(id) ?? '');
          },
          // in order with the changes received (being decrypted): the ones received before were applied before it
          (answer) =>
            this._inOrder(() => {
              this.#acknowledging = true;
              this.#unconfirmed.delete(unconfirmed);
              // dropped beyond the rate of messages of the server: not applied
              if (answer?.refused === 'rate') this._dropped(unconfirmed);
              this._forgetLeftOut(unconfirmed);
            })
        );

        if (result) return result.then(() => emit(i + 1));
      }
      finish();
    };

    return emit(0);
  }

  /**
   * Change cut into messages small enough for the server (encrypted ones are bigger): shapes with the image files the
   * room does not have yet, a shape and its files too big together apart, then other files of the drawing the room does
   * not have (images read later); removals and background in the first one, stacking order in the last one
   * @param shapes Shapes to send, in stacking order
   * @param current JSON of the shapes of the drawing by id
   * @param remove Ids of removed shapes
   * @param order Ids of all shapes from bottom to top when stacking order changed, else false
   * @param background Background color when changed
   * @param used Ids of the image files of the drawing
   * @returns Parts to send in order, none when nothing changed
   */
  private _split(
    shapes: DrawingShape[],
    current: Map<string, string>,
    remove: string[],
    order: string[] | false,
    background: string | undefined,
    used: Set<string>
  ): ChangePart[] {
    const added = new Set<string>();
    // image files the room does not have yet, each one once
    const unsent = (fileIds: Iterable<string>) =>
      [...fileIds]
        .filter((fileId) => !this.#sentFiles.has(fileId) && !this.#tooBig.has(fileId) && !added.has(fileId))
        .filter((fileId) => this.drawer.files.has(fileId))
        .map((fileId): [string, string] => {
          added.add(fileId);
          return [fileId, this.drawer.files.get(fileId)!];
        });

    if (!shapes.length && !remove.length && !order && background === undefined && !unsent(used).length) return [];
    added.clear();

    const budget = Collaboration.maxMessageSize / (this.cipher ? 2 : 1.25);
    const first: ChangePart = {
      change: { upsert: [], remove, ...(background !== undefined && { background }) },
      ids: [],
    };
    const parts = [first];
    let size = JSON.stringify(first.change).length;
    // part holding something to send: a new part for what does not fit
    let filled = remove.length > 0 || background !== undefined;
    const filesSize = (files: [string, string][]) =>
      files.reduce((sum, [fileId, data]) => sum + fileId.length + data.length + 8, 0);
    /**
     * Shape and image files added to the last part, or to a new one when they do not fit in it
     * @param id Id of the shape, null for files alone
     * @param jsonSize Length of the JSON of the shape in the message (escaped)
     * @param files Image files sent with it, by id
     */
    const add = (id: string | null, jsonSize: number, files: [string, string][]) => {
      const itemSize = jsonSize + filesSize(files);
      let part = parts[parts.length - 1];

      if (filled && size + itemSize > budget) {
        part = { change: { upsert: [], remove: [] }, ids: [] };
        parts.push(part);
        size = 0;
      }
      if (id !== null) {
        part.change.upsert.push(current.get(id)!);
        part.ids.push(id);
      }
      if (files.length) part.change.files = { ...part.change.files, ...Object.fromEntries(files) };
      size += itemSize;
      filled = true;
    };

    for (const shape of shapes) {
      const id = shape.id();
      const jsonSize = JSON.stringify(current.get(id)).length;
      // with the first shape using them
      const files = unsent(getFileIds([shape]));

      if (jsonSize + filesSize(files) > budget) {
        for (const file of files) add(null, 0, [file]);
        add(id, jsonSize, []);
      } else {
        add(id, jsonSize, files);
      }
    }
    // files of shapes known by the room (images read later): alone
    for (const file of unsent(used)) add(null, 0, [file]);
    if (order) {
      if (filled && size + JSON.stringify(order).length > budget)
        parts.push({ change: { upsert: [], remove: [] }, ids: [] });
      parts[parts.length - 1].change.order = order;
    }

    return parts;
  }

  /**
   * Change small enough for the server: a bigger message would close the connection, and the reconnection would send it
   * again (loop). Told as a drawing too big
   * @param change Change to send (encrypted in an encrypted room)
   * @returns True when it can be sent
   */
  private _fits(change: DrawingChange | EncryptedChange) {
    const max = Collaboration.maxMessageSize;
    const json = JSON.stringify(change);

    // bytes of UTF-8: 3 at most by UTF-16 unit, counted only near the limit
    if (json.length * 3 <= max || new TextEncoder().encode(json).length <= max) return true;
    this._tellTooBig();
    return false;
  }

  /**
   * Drawing too big for the session (changes not shared) told, again after a while
   */
  private _tellTooBig() {
    if (Date.now() - this.#tooBigAt <= 10_000) return;

    this.#tooBigAt = Date.now();
    this.drawer.toast(this.drawer.t('toast.collaborationTooBig'), 'warning');
  }

  /**
   * Apply change of another client, after current pointer action (not to alter shape being drawn)
   * @param change Change received from the server (live previews are applied at once)
   */
  receive(change: DrawingChange) {
    const [received, bases] = this._withoutUnconfirmed(change);

    // preview of other users drawing: shown at once, not saved nor added to history (final change follows)
    if (received.live) {
      this._applyReceived(received, bases);
      return;
    }

    // also after changes still waiting (action just ended: applied once the tool finished, see `Drawer._onActionEnd`)
    if (this.drawer._duringAction() || this.#pending.length) {
      this.#pending.push([received, false, bases]);
      return;
    }

    this._applyReceived(received, bases);
    // saved and added to history, not sent back (synced); during a drag or a transform, with its change once it ends
    // (one change of this user, its shapes sent once dropped)
    if (!this.drawer._duringMove()) this.drawer.stage.fire('change');
  }

  /**
   * Apply changes received during a pointer action
   * @returns true if a change was applied
   */
  flush() {
    const pending = this.#pending;

    this.#pending = [];
    this.#rejoinPending = false;
    // in the order received: changes received after the drawing of the room are not reverted by its merge
    for (const [change, rejoin, bases] of pending) {
      if (rejoin) this._merge(change);
      else this._applyReceived(change, bases);
    }

    return pending.length > 0;
  }

  /**
   * Change of another user received before the server acknowledged changes of this user: the server applied it before
   * them, their shapes (added, changed, removed), background and stacking order are left out of it (else this user would
   * keep the version of the other user, the room and the other users the one of this user): kept in `#leftOut`, applied
   * if the change of this user is refused. Groups and frames they changed are kept with the state the room had before
   * them: merged by `_applyReceived` (shapes the other user added in them kept). Servers of previous versions
   * acknowledge nothing: changes applied as they are
   * @param change Change received from the server
   * @returns The change without the parts changed by the changes not acknowledged, and the JSON known by the room before
   * them of the shapes kept in it, by id
   */
  private _withoutUnconfirmed(change: DrawingChange): [DrawingChange, Map<string, string>] {
    const bases = new Map<string, string>();

    if (!this.#acknowledging || !this.#unconfirmed.size) return [change, bases];

    const ids = new Set<string>();
    const before = new Map<string, string>();
    let background = false;
    let order = false;

    for (const part of this.#unconfirmed) {
      for (const id of [...part.upsert, ...part.remove]) ids.add(id);
      // before the first change of this user
      for (const [id, json] of part.before) if (!before.has(id)) before.set(id, json);
      background ||= part.background;
      order ||= part.order;
    }

    const { upsert, remove, ...rest } = change;
    const kept = (Array.isArray(upsert) ? upsert : []).filter((json) => {
      const state = parseShapeState(json);
      const id = state?.attrs.id as string;

      if (!ids.has(id)) return true;
      // group or frame: merged
      if (state?.children && before.has(id)) {
        bases.set(id, before.get(id)!);
        return true;
      }
      // applied if the change of this user is refused
      this.#leftOut.set(id, json);
      return false;
    });
    const removed = (Array.isArray(remove) ? remove : []).filter((id) => {
      if (!ids.has(id)) return true;
      this.#leftOut.set(id, null);
      return false;
    });

    return [
      {
        ...rest,
        upsert: kept,
        remove: removed,
        ...(background && { background: undefined }),
        ...(order && { order: undefined }),
      },
      bases,
    ];
  }

  /**
   * Change of another user applied, but to the shapes and background this user changed and did not send yet (end of a
   * pointer action, encryption of a change): sent next, the server applies them after it. Groups and frames changed by
   * both users are merged (`_mergeOf`: shapes added in them by each one kept), also the ones of changes of this user not
   * acknowledged when it came; the merge is sent next. A viewer sends nothing: the whole change is applied
   * @param change Change received from the server
   * @param bases JSON known by the room before the changes of this user not acknowledged when it came, of the shapes they
   * changed (see `_withoutUnconfirmed`)
   */
  private _applyReceived(change: DrawingChange, bases = new Map<string, string>()) {
    if (!this.canEdit) {
      this._apply(change, (id) => bases.has(id));
      return;
    }

    const synced = this.#synced;
    const shapes = new Map(this.drawer.getDrawingShapes().map((shape) => [shape.id(), shape]));
    // changed or removed here since the last sync (shapes too big for a message: not sent)
    const unsent = (id: string) => {
      const shape = shapes.get(id);

      // removed here, removal refused: the shape of the room
      if (!shape) return synced.has(id) && this.#refused.get(id) !== '';

      const json = serializeShape(shape);

      return synced.get(id) !== json && this.#tooBig.get(id) !== json && this.#refused.get(id) !== json;
    };
    const color = this.drawer.background.fill() as string;
    const recolored =
      this.#syncedBackground !== null && color !== this.#syncedBackground && checkBackground(color) !== null;
    // room: the change of the other user, or the changes of this user applied after it
    const merge = (shape: DrawingShape, state: ShapeState, json: string) => {
      const id = shape.id();
      const base = bases.get(id) ?? synced.get(id);

      return base ? this._mergeOf(shape, base, state, bases.has(id) ? synced.get(id) ?? '' : json) : null;
    };

    this._apply(recolored ? { ...change, background: undefined } : change, (id) => bases.has(id) || unsent(id), merge);
  }

  /**
   * Group or frame changed here and by another user: the change of this user applied over the one of the other user
   * (`mergeState`: shapes added in it by each one kept, attributes and shapes changed here kept)
   * @param shape Group or frame of the drawing
   * @param base JSON known by the room before both changes
   * @param theirs State of the other user (checked)
   * @param synced JSON known by the room once the merge is applied
   * @returns The merge, null for another kind of shape (kept as it is here)
   */
  private _mergeOf(shape: DrawingShape, base: string, theirs: ShapeState, synced: string): ShapeMerge | null {
    if (!(shape instanceof Container) || shape.getClassName() !== theirs.className || !theirs.children) return null;

    let state: ShapeState;

    try {
      state = JSON.parse(base);
    } catch {
      return null;
    }
    if (state?.className !== theirs.className || !Array.isArray(state.children)) return null;

    const local = serializeShape(shape);

    return { state: mergeState(JSON.parse(local), state, theirs), synced, local, base: state, theirs };
  }

  /**
   * Room joined (first time, or again after a disconnection): drawing of the room merged with this one, after the
   * current pointer action
   * @param change Whole drawing of the room (`full`)
   */
  private _rejoin(change: DrawingChange) {
    this.#rejoining = false;
    if (this.drawer._duringAction() || this.#pending.length) {
      this.#pending.push([change, true]);
      this.#rejoinPending = true;
      return;
    }

    this._merge(change);
    // saved, added to history, changes made meanwhile sent (during a drag or a transform: once it ends)
    if (!this.drawer._duringMove()) this.drawer.stage.fire('change');
  }

  /**
   * Drawing of the room merged with this one once joined: shapes added or changed here since the last sync are kept
   * (sent next), others take their state in the room, shapes removed by other users meanwhile are removed (unless
   * changed here). On first join, the shapes known by the room in a previous visit of this browser are known again
   * (`#restored`), other shapes of the room take their state there (a copy of them is not newer), shapes only here are
   * added to the room. A room without drawing (new, last user gone, server restarted: not `kept`) gets the whole
   * drawing, with its image files; a room emptied by its users is merged as any other
   * @param change Whole drawing of the room (`full`)
   */
  private _merge({ upsert, order, background, files, kept }: DrawingChange) {
    const room = new Map<string, string>();
    const restored = this.#restored;

    this.#restored = null;
    this.#syncChanged = true;
    // files of the room, before its shapes
    this._receiveFiles(files);
    const color = this.drawer.background.fill() as string;

    // background changed here meanwhile kept (sent next), else the one of the room (none: this one sent)
    if (this.#syncedBackground === null || color === this.#syncedBackground) this._applyBackground(background, true);

    for (const json of Array.isArray(upsert) ? upsert : []) {
      const state = parseShapeState(json);

      if (state) room.set(state.attrs.id as string, json);
    }
    // room without drawing (previews of shapes being drawn only); servers of previous versions: an empty room
    if (kept === false || (!room.size && kept !== true)) {
      this.#synced.clear();
      this.#sentFiles.clear();
      return;
    }

    const current = new Map(this.drawer.getDrawingShapes().map((shape) => [shape.id(), serializeShape(shape)]));

    if (restored) {
      // known by the room and not changed since, or unknown but in the room
      for (const [id, json] of current) {
        const hash = restored.get(id);

        if (hash === undefined ? room.has(id) : hash === hashText(json)) this.#synced.set(id, json);
      }
    }

    const synced = this.#synced;
    // since last sync: added or changed here, removed here (also previews discarded while disconnected)
    const changed = new Set([...current].filter(([id, json]) => synced.get(id) !== json).map(([id]) => id));
    const removed = [...new Set([...synced.keys(), ...this.#sentLive])].filter((id) => !current.has(id));
    // stacking order of this user lost with the connection: kept, sent next
    const orderLost = this.#orderLost;
    // groups and frames changed here and in the room: merged, sent next
    const merged = new Set<string>();

    this.#orderLost = false;
    this._apply(
      {
        upsert: [...room].filter(([id]) => !removed.includes(id)).map(([, json]) => json),
        remove: [...current.keys()].filter((id) => !room.has(id) && !changed.has(id)),
        ...(Array.isArray(order) && !orderLost && { order }),
      },
      (id) => changed.has(id),
      (shape, state, json) => {
        const base = synced.get(shape.id());
        const merge = base ? this._mergeOf(shape, base, state, json) : null;

        if (merge) merged.add(shape.id());
        return merge;
      }
    );
    // known in the order of the room
    if (orderLost && Array.isArray(order)) {
      const known = this.#synced;

      this.#synced = new Map([
        ...order.filter((id) => known.has(id)).map((id): [string, string] => [id, known.get(id)!]),
        ...[...known].filter(([id]) => !order.includes(id)),
      ]);
    }
    // sent next: changes made here as new ones, removals of shapes still in the room
    for (const id of changed) if (!merged.has(id)) this.#synced.delete(id);
    for (const id of removed) if (room.has(id)) this.#synced.set(id, room.get(id)!);
  }

  /**
   * Change refused by the server (drawing too big, right to draw removed meanwhile) or lost with the connection: its
   * shapes are not known by the room, sent again with a next change (with their image files), or their removal when they
   * were removed since (the room may have an older state)
   * @param upsert Ids of its shapes added or updated (not trusted)
   * @param remove Ids of its removed shapes (not trusted)
   */
  private _unsync(upsert: unknown, remove: unknown) {
    const ids = (value: unknown) => (Array.isArray(value) ? value.filter((id) => typeof id === 'string') : []);
    const shapes = new Map(this.drawer.getDrawingShapes().map((shape) => [shape.id(), shape]));
    const refused = ids(upsert).flatMap((id) => shapes.get(id) ?? []);

    for (const id of ids(upsert)) {
      if (shapes.has(id)) this.#synced.delete(id);
      else this.#synced.set(id, '');
    }
    // removal sent again: shape known by the room
    for (const id of ids(remove)) if (!shapes.has(id)) this.#synced.set(id, '');
    for (const id of getFileIds(refused)) this.#sentFiles.delete(id);
    this.#syncChanged = true;
  }

  /**
   * Change refused by the server (drawing too big, right to draw removed meanwhile): its shapes are not known by the room
   * (`_unsync`, sent again later). Changes of other users left out for it are applied: the server applied them, not
   * this one; later ones too while its shapes are not changed here (`#refused`)
   * @param upsert Ids of its shapes added or updated (not trusted)
   * @param remove Ids of its removed shapes (not trusted)
   */
  private _refuse(upsert: unknown, remove: unknown) {
    const ids = (value: unknown) => (Array.isArray(value) ? value.filter((id) => typeof id === 'string') : []);
    const shapes = new Map(this.drawer.getDrawingShapes().map((shape) => [shape.id(), shape]));
    const theirs: DrawingChange = { upsert: [], remove: [] };

    this._unsync(upsert, remove);
    for (const id of [...ids(upsert), ...ids(remove)]) {
      const shape = shapes.get(id);
      const json = this.#leftOut.get(id);

      this.#refused.set(id, shape ? serializeShape(shape) : '');
      if (json === undefined) continue;
      this.#leftOut.delete(id);
      if (json === null) theirs.remove.push(id);
      else theirs.upsert.push(json);
    }
    if (!theirs.upsert.length && !theirs.remove.length) return;
    // as a change received: after the current pointer action
    if (this.drawer._duringAction() || this.#pending.length) {
      this.#pending.push([theirs, false]);
      return;
    }
    this._applyReceived(theirs);
    if (!this.drawer._duringMove()) this.drawer.stage.fire('change');
  }

  /**
   * Part of a change dropped by the server, beyond the rate of messages of this client: refused as by `REJECTED` (changes
   * of others left out for it applied), its shapes, files and background sent again after a while (`retryDelay`)
   * @param part Part dropped
   */
  private _dropped(part: UnconfirmedPart) {
    this._refuse(part.upsert, part.remove);
    for (const id of part.files) this.#sentFiles.delete(id);
    // the room may have another one
    if (part.background) this.#syncedBackground = '';
    if (this.#timers.retry) return;
    this.#timers.retry = setTimeout(() => {
      this.#timers.retry = undefined;
      this.send();
    }, Collaboration.retryDelay);
  }

  /**
   * Part of a change of this user acknowledged: applied by the server after the changes of others left out for it,
   * which are forgotten (unless a change of this user not acknowledged yet changed their shapes too)
   * @param part Part acknowledged
   */
  private _forgetLeftOut(part: UnconfirmedPart) {
    if (!this.#leftOut.size) return;

    const unconfirmed = [...this.#unconfirmed];

    for (const id of [...part.upsert, ...part.remove]) {
      if (!unconfirmed.some((other) => other.upsert.includes(id) || other.remove.includes(id)))
        this.#leftOut.delete(id);
    }
  }

  /**
   * Connection lost: parts of changes sent while it was lost unseen (not acknowledged, sent in the time a lost
   * connection takes to be seen) are unsynced, sent again once joined: the merge with the drawing of the room keeps
   * them (else shapes drawn meanwhile would be removed, changes reverted)
   */
  private _unconfirm() {
    const since = Date.now() - lossWindow;

    for (const part of this.#unconfirmed) {
      if (part.at < since) continue;
      this._unsync(part.upsert, part.remove);
      for (const id of part.files) this.#sentFiles.delete(id);
      // background of this user kept by the merge (not the one known by the room), sent again
      if (part.background) this.#syncedBackground = '';
      if (part.order) this.#orderLost = true;
    }
    this.#unconfirmed.clear();
    // the drawing of the room merged once joined again
    this.#leftOut.clear();
  }

  /**
   * Shapes known by the room kept in browser (hashes of their JSON), once changed: a page reloaded in the room knows
   * which of its shapes the room has (`_merge`). Kept for the rooms used last
   */
  private _keepSynced() {
    if (!this.#syncChanged) return;

    this.#syncChanged = false;
    try {
      localStorage.setItem(
        this._syncKey(this.room),
        JSON.stringify([...this.#synced].map(([id, json]) => [id, hashText(json)]))
      );
    } catch {
      // not kept (storage full or unavailable): the room is merged as by a new user next time
    }
  }

  /**
   * Shapes known by the room in a previous visit of this browser, see `_keepSynced`; the room is now the one used last
   * @returns Hashes of their JSON by id, empty when none were kept
   */
  private _readSynced(): Map<string, string> {
    const key = `${this.drawer.options.localStorageKey}-rooms`;

    try {
      const rooms = (JSON.parse(localStorage.getItem(key) ?? '[]') as string[]).filter((room) => room !== this.room);
      const forgotten = rooms.splice(0, Math.max(0, rooms.length + 1 - keptRooms));

      for (const room of forgotten) localStorage.removeItem(this._syncKey(room));
      localStorage.setItem(key, JSON.stringify([...rooms, this.room]));

      const shapes = JSON.parse(localStorage.getItem(this._syncKey(this.room)) ?? '[]');

      return new Map(
        Array.isArray(shapes)
          ? shapes.filter(
              (shape): shape is [string, string] =>
                Array.isArray(shape) && typeof shape[0] === 'string' && typeof shape[1] === 'string'
            )
          : []
      );
    } catch {
      return new Map();
    }
  }

  /**
   * Key of localStorage keeping the shapes known by a room
   * @param room Id of the room
   * @returns Key of the drawer for this room
   */
  private _syncKey(room: string) {
    return `${this.drawer.options.localStorageKey}-room-${room}`;
  }

  /**
   * Image files received from the room: added to the drawing (valid ones), known by the room
   * @param files Files of a change (not trusted)
   */
  private _receiveFiles(files: unknown) {
    const valid = parseFiles(files);

    this.drawer.addFiles(valid);
    for (const id of Object.keys(valid)) this.#sentFiles.add(id);
  }

  /**
   * Apply a change of another client: shapes removed, updated (groups replaced, selection kept) or added, stacking
   * order applied. Shapes are recorded as synced, so the change is not sent back. Only drawing shapes are created, as
   * from files: other nodes (stage, layers...) and invalid shapes are ignored
   * @param change Change received (or drawing of the room merged)
   * @param kept Tells the shapes kept as they are here (changed here, sent next): neither updated nor removed
   * @param merge Merge of a group or frame kept with the state received (null: kept as it is), see `_mergeOf`
   */
  private _apply(
    change: DrawingChange,
    kept?: (id: string) => boolean,
    merge?: (shape: DrawingShape, state: ShapeState, json: string) => ShapeMerge | null
  ) {
    const { upsert, remove, order, background, full, files } = change;

    // files of images, before the images using them
    this._receiveFiles(files);
    this.#syncChanged = true;

    const shapes = new Map(this.drawer.getDrawingShapes().map((shape) => [shape.id(), shape]));
    // shapes of other users: not changes of this user in history
    const changed: string[] = [];
    // groups and frames changed here too: changes of this user kept in history
    const merges: ShapeMerge[] = [];

    for (const id of Array.isArray(remove) ? remove : []) {
      if (kept?.(id)) continue;
      shapes.get(id)?.destroy();
      this.#synced.delete(id);
      this.#refused.delete(id);
      changed.push(id);
    }

    for (const json of Array.isArray(upsert) ? upsert : []) {
      const state = parseShapeState(json);

      if (!state) {
        console.warn('Shape of another user ignored: not a drawing shape');
        continue;
      }
      let shape = shapes.get(state.attrs.id as string);
      // changed here too: merged (group or frame of the same class), else kept as it is
      const merged = kept?.(state.attrs.id as string)
        ? (shape && merge?.(shape, state, json as string)) || null
        : undefined;

      if (merged === null) continue;
      // same nodes updated (groups and frames with their shapes): selection, text being edited, drags kept
      if (shape && !this._update(shape, merged?.state ?? state)) {
        // another class: replaced at same place, still selected
        const index = shape.zIndex();
        const selected = this.drawer.getSelectedShapes();
        // created before the shape is removed
        const node = Node.create(state) as DrawingShape;

        shape.destroy();
        shape = this.drawer._addShape(node);
        shape.zIndex(index);
        if (selected.some((node) => !node.getLayer())) {
          this.drawer
            .getWidget<SelectWidget>('selection')
            ?.select([...selected.filter((node) => node.getLayer()), shape]);
        }
      } else if (!shape) {
        shape = this.drawer._addShape(Node.create(state) as DrawingShape);
      }
      this.#refused.delete(shape.id());
      if (merged) {
        // sent next: the room has the state received, or the changes of this user applied after it
        this.#synced.set(shape.id(), merged.synced);

        merges.push(merged);
        continue;
      }
      // as serialized here, not to send it back
      this.#synced.set(shape.id(), serializeShape(shape));
      changed.push(shape.id());
    }

    if (Array.isArray(order)) {
      applyOrder(this.drawer.getDrawingShapes(), order);

      const synced = this.#synced;
      const drawn = this.drawer.getDrawingShapes().map((shape) => shape.id());
      const ids = new Set(drawn);

      // known in this order, not to send it back; shapes removed here, removal not sent yet, kept (sent next)
      this.#synced = new Map([
        ...drawn.filter((id) => synced.has(id)).map((id): [string, string] => [id, synced.get(id)!]),
        ...[...synced].filter(([id]) => !ids.has(id)),
      ]);
    }

    // removed shapes are not selected anymore (also shapes of groups removed by an update)
    const transformer = this.drawer.getWidget<SelectWidget>('selection')?.transformer;
    if (transformer?.nodes().some((node) => !node.getLayer()))
      transformer.nodes(transformer.nodes().filter((node) => node.getLayer()));
    // undo and redo of this user keep them, stacking order of others too
    this.drawer.undoRedo.ignoreChanges(changed);
    for (const merged of merges) this.drawer.undoRedo.ignoreMerged(merged);

    this._applyBackground(background, full);
  }

  /**
   * Node of the drawing updated to the state of another user, in place: groups and frames keep their nodes, matched by
   * id (selection, text being edited, drags of their shapes kept); nodes new in the state are created, missing ones
   * removed, in the order of the state
   * @param node Node of the drawing with the id of the state
   * @param state State of another user (checked)
   * @returns false when the node is of another class: to replace
   */
  private _update(node: Node, state: ShapeState): boolean {
    if (node.getClassName() !== state.className) return false;

    // attributes removed by other client are removed, not local ones (draggable, hit and scene functions, element of
    // an image); dragged alone or not here
    const attrs = { ...state.attrs };

    delete attrs.draggable;
    const removed = Object.keys(node.attrs).filter(
      (key) =>
        !(key in attrs) &&
        key !== 'draggable' &&
        typeof node.getAttr(key) !== 'function' &&
        !(node.getAttr(key) instanceof HTMLImageElement)
    );

    for (const key of removed) node.setAttr(key, undefined);
    node.setAttrs(attrs);
    if (!(node instanceof Container)) return true;

    const children = new Map(node.getChildren().map((child) => [child.id(), child]));
    const nodes = (state.children ?? []).map((childState) => {
      const id = childState.attrs.id as string;
      const child = children.get(id);

      children.delete(id);
      if (child && this._update(child, childState)) return child;
      child?.destroy();

      return Node.create(childState) as DrawingShape;
    });

    for (const child of children.values()) child.destroy();
    nodes.forEach((child, index) => {
      if (child.getParent() !== node) {
        node.add(child);
        this.drawer._setupAdded(child as DrawingShape);
      }
      child.zIndex(index);
    });

    return true;
  }

  /**
   * Background color of another user, or of the room (whole drawing): shown and known as synced, not sent back. A room
   * without background gets the one of this user (sent next)
   * @param background Color received (checked)
   * @param room Background of the room (whole drawing): none means the room has none
   */
  private _applyBackground(background: unknown, room = false) {
    const color = checkBackground(background);

    if (!color) {
      if (room) this.#syncedBackground = '';
      return;
    }
    this.drawer._setBackground(color);
    this.#syncedBackground = color;
    // not a change of this user: undo keeps it
    this.drawer.undoRedo.ignoreBackground();
  }
}
