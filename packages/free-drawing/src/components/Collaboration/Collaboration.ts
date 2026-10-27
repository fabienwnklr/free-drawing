import type { Drawer } from '@/Drawer';
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
import { maxMessageSize, socketEvents } from '@free-drawing/protocol';
import { applyOrder } from '@/utils/order';
import { parseShapeState } from '@/utils/drawingFile';
import { getFileIds, parseFiles } from '@/utils/image';
import { decryptChange, encryptChange, type RoomCipher } from '@/utils/encryption';
import type { ColorLike, DrawingShape } from '@/@types/drawer';
import type { TranslationKey } from '@/@types/i18n';
import type {
  DrawingChange,
  EncryptedChange,
  EncryptedMessage,
  RemotePointer,
  CollaborationSocket,
  CollaborationMember,
  CollaborationSession,
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
  /** Image files the room has (sent or received): a file is sent once, with the first shape using it */
  #sentFiles = new Set<string>();
  /**
   * Background color as other clients know it: null until the one of the room is received (a joining user does not
   * impose theirs), empty when the room has none (this one sent)
   */
  #syncedBackground: string | null = null;
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
    { room, name, userId = '', ownerKey, invitedBy, cipher }: CollaborationSession
  ) {
    this.drawer = drawer;
    this.socket = socket;
    this.room = room;
    this.name = name;
    this.userId = userId;
    this.ownerKey = ownerKey;
    this.invitedBy = invitedBy;
    this.cipher = cipher ?? null;

    this.socket.on('connect', () => {
      if (this.#stopped) return;
      if (this.drawer.debug) console.log('🌍 Connected to collaboration server');
      const { room, name, userId, ownerKey, invitedBy } = this;

      const rejoin = this.#joined;

      // before the answer of the server: connected again, drawing of the room merged with changes made meanwhile
      // (`_merge`), not a copy of this one
      this.#connection++;
      this.#connected = true;
      this.#joined = true;
      this.#rejoining = rejoin;
      // first join: background of the room received first (a joining user does not impose theirs)
      if (!rejoin) this.#syncedBackground = null;
      // encrypted room: proof of its key, users with another key (or none) are refused
      this.socket.emit(socketEvents.JOIN, {
        room,
        name,
        userId,
        ownerKey,
        invitedBy,
        ...(this.cipher && { keyCheck: this.cipher.keyCheck }),
      });
      // presentation going on after a reconnection
      if (this.presenting) this._sendView();
      if (rejoin) return;
      // first join: whole drawing sent, merged with other ones of the room
      this.#synced.clear();
      this.#sentFiles.clear();
      this.send();
    });
    this.socket.on('disconnect', () => {
      this.#connection++;
      this.#connected = false;
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
    // message refused by the server: room full (session stopped), drawing too big (changes not shared), key of an
    // encrypted room missing or wrong (session stopped)
    this._listen(socketEvents.REJECTED, ({ reason }: RejectedMessage = {}) => {
      if (reason === 'full') {
        this.drawer.toast(this.drawer.t('toast.collaborationFull'), 'error');
        this.drawer.stopCollaboration();
      } else if (reason === 'too-big') {
        this._tellTooBig();
      } else if (reason === 'key') {
        this._stopWith('error.roomKey');
      }
    });
    // names only from servers without rights
    this._listen(socketEvents.USERS, (users: (CollaborationMember | string)[]) => {
      const canEdit = this.canEdit;
      // first users of the room: right of this user known now (view only by default)
      const joined = !this.members.length;

      // joined again a server without drawing of the room (`full`, sent before users): whole drawing sent as before
      if (this.#rejoining) {
        this.#rejoining = false;
        this.#synced.clear();
        this.#sentFiles.clear();
        this.send();
      }

      this.members = users.map((user) =>
        typeof user === 'string' ? { id: '', name: user, owner: false, canEdit: true } : user
      );
      this.users = this.members.map((member) => member.name);
      // requests answered: users gone or allowed to draw since
      this.requests = this.requests.filter(({ userId }) =>
        this.members.some((member) => member.id === userId && !member.canEdit)
      );
      if (this.canEdit) this.requested = false;
      if (this.canEdit !== canEdit) this.drawer._onCollaborationRight(this.canEdit, joined);
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
   * @returns Promise while it is encrypted (sent unless the connection was lost meanwhile)
   */
  private _emitChange(change: DrawingChange, sent: () => void, volatile = false): Promise<void> | void {
    const emit = (message: DrawingChange | EncryptedChange) => {
      if (!this._fits(message)) return;
      sent();
      (volatile ? this.socket.volatile : this.socket).emit(socketEvents.CHANGE, message);
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
   * Shapes being drawn or moved shown to other users while drawing, final state is sent by `send` on change
   * @param shapes Shapes being drawn or moved (shapes of groups send their whole group)
   */
  sendLive(shapes: DrawingShape[]) {
    // shapes of groups: whole group
    shapes.forEach((shape) => {
      const drawingShape = this.drawer.getDrawingShapes().find((s) => s === shape || s.isAncestorOf(shape));

      if (drawingShape) this.#live.add(drawingShape);
    });
    this._schedule('live', () =>
      this._inOrder(() => {
        const shapes = [...this.#live].filter((shape) => shape.getLayer());

        this.#live.clear();
        if (!shapes.length) return;

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
    // after a preview being encrypted
    this._inOrder(() => {
      if (this.#sentLive.delete(id) && this.#connected) {
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
    for (const cursor of this.#cursors.values()) cursor.destroy();
    this.#cursors.clear();
    for (const laser of this.#lasers.values()) laser.destroy();
    this.#lasers.clear();
    // slide of the owner no longer seen alone
    if (this.presentedView?.slide) this.drawer.slideshow.hideSlideArea();
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
    // sent once joined again (drawing of the room merged first): not marked synced meanwhile
    if (!this.#connected || this.#rejoining || this.#rejoinDrawing) return;

    const current = new Map(this.drawer.getDrawingShapes().map((shape) => [shape.id(), serializeShape(shape)]));
    const upsert = [...current].filter(([id, json]) => this.#synced.get(id) !== json).map(([, json]) => json);
    // also previews of shapes removed before their final change
    const remove = [...new Set([...this.#synced.keys(), ...this.#sentLive])].filter((id) => !current.has(id));
    const ids = [...current.keys()];
    const added = ids.filter((id) => !this.#synced.has(id));
    // stacking order of known shapes changed (reorder, undo...), or new shapes not on top (group, ungroup...):
    // new shapes are added on top by others
    const reordered =
      ids.filter((id) => this.#synced.has(id)).join() !==
        [...this.#synced.keys()].filter((id) => current.has(id)).join() ||
      added.join() !== ids.slice(ids.length - added.length).join();
    const background = this.drawer.background.fill() as string;
    // changed here, once the background of the room is known
    const recolored = this.#syncedBackground !== null && background !== this.#syncedBackground;
    // image files of the changed shapes the room does not have yet
    const upserted = this.drawer
      .getDrawingShapes()
      .filter((shape) => this.#synced.get(shape.id()) !== current.get(shape.id()));
    const fileIds = getFileIds(upserted).filter((id) => !this.#sentFiles.has(id) && this.drawer.files.has(id));
    const change: DrawingChange = {
      upsert,
      remove,
      ...(reordered && { order: [...current.keys()] }),
      ...(recolored && { background }),
      ...(fileIds.length > 0 && { files: Object.fromEntries(fileIds.map((id) => [id, this.drawer.files.get(id)!])) }),
    };

    const changed = upsert.length > 0 || remove.length > 0 || reordered || recolored;
    const sent = () => {
      this.#synced = current;
      for (const id of fileIds) this.#sentFiles.add(id);
      if (recolored) this.#syncedBackground = background;
      // final state sent, previews useless
      this.#live.clear();
      this.#sentLive.clear();
    };

    if (!changed) return sent();
    // too big for the server: not marked synced (kept by a merge after a reconnection), sent with a next change
    return this._emitChange(change, sent);
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
  private _merge({ upsert, order, background, files }: DrawingChange) {
    const room = new Map<string, string>();

    // files of the room, before its shapes
    this._receiveFiles(files);
    const color = this.drawer.background.fill() as string;

    // background changed here meanwhile kept (sent next), else the one of the room (none: this one sent)
    if (this.#syncedBackground === null || color === this.#syncedBackground) this._applyBackground(background, true);

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
   */
  private _apply({ upsert, remove, order, background, full, files }: DrawingChange) {
    // files of images, before the images using them
    this._receiveFiles(files);

    const shapes = new Map(this.drawer.getDrawingShapes().map((shape) => [shape.id(), shape]));
    // shapes of other users: not changes of this user in history
    const changed: string[] = [];

    for (const id of Array.isArray(remove) ? remove : []) {
      shapes.get(id)?.destroy();
      this.#synced.delete(id);
      changed.push(id);
    }

    for (const json of Array.isArray(upsert) ? upsert : []) {
      const state = parseShapeState(json);

      if (!state) {
        console.warn('Shape of another user ignored: not a drawing shape');
        continue;
      }

      const { className } = state;
      const attrs = state.attrs as ShapeConfig;
      let shape = shapes.get(attrs.id as string);

      // groups replaced with their shapes, at same place, still selected
      if (shape && (shape instanceof Group || className === 'Group')) {
        const index = shape.zIndex();
        const selected = this.drawer.getSelectedShapes();
        // created before the group is removed
        const node = Node.create(state) as DrawingShape;

        shape.destroy();
        shape = this.drawer.addShape(node);
        shape.zIndex(index);
        if (selected.some((node) => !node.getLayer())) {
          this.drawer
            .getWidget<SelectWidget>('selection')
            ?.select([...selected.filter((node) => node.getLayer()), shape]);
        }
      } else if (shape) {
        // same node (kept in selection): attributes removed by other client are removed, not local ones (draggable,
        // hit and scene functions, element of an image)
        const node: Node = shape;
        const removed = Object.keys(node.attrs).filter(
          (key) =>
            !(key in attrs) &&
            key !== 'draggable' &&
            typeof node.getAttr(key) !== 'function' &&
            !(node.getAttr(key) instanceof HTMLImageElement)
        );

        for (const key of removed) node.setAttr(key, undefined);
        shape.setAttrs(attrs);
      } else {
        shape = this.drawer.addShape(Node.create(state) as DrawingShape);
      }
      // as serialized here, not to send it back
      this.#synced.set(shape.id(), serializeShape(shape));
      changed.push(shape.id());
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
    // undo and redo of this user keep them, stacking order of others too
    this.drawer.undoRedo.ignoreChanges(changed);
    this._applyBackground(background, full);
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
