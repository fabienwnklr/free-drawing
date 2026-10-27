/**
 * Socket.io events of live collaboration, sent by drawers (`@fabwcie/free-drawing`) and server
 */
export declare const socketEvents: {
  /**
   * Join a room: `{ room, name, userId, ownerKey, invitedBy, keyCheck }`, `keyCheck` proof of the key of an encrypted
   * room (SHA-256 of the key, base64url): the room is encrypted by the user creating it, joined with the same proof only
   */
  readonly JOIN: 'JOIN';
  /** Room joined, sent by server to the joining user: `{ userId }` id it gives the user (e.g. of logged in account) */
  readonly JOINED: 'JOINED';
  /** Name of user changed */
  readonly NAME: 'NAME';
  /** Users of the room `{ id, name, owner, canEdit, invitedBy }` (sent by server) */
  readonly USERS: 'USERS';
  /**
   * Drawing change `{ upsert, remove, order, live, full, background, files }`: shapes added or updated, ids of removed
   * shapes, stacking order, preview of shapes being drawn, whole drawing of the room (sent by server to a joining user,
   * with its background once a user sent one), background color when changed, image files by id. Encrypted room:
   * `upsert` is `{ id, data }` (encrypted JSON), `background` and `files` (under random ids) encrypted, not read by
   * the server
   */
  readonly CHANGE: 'CHANGE';
  /**
   * Pointer of a user: canvas position `{ x, y, laser }` (null out of drawer, `laser` while laser pointer is used), with
   * user id and name from server; encrypted room: `{ data }` (encrypted position)
   */
  readonly POINTER: 'POINTER';
  /** User left the room (id, sent by server) */
  readonly LEAVE: 'LEAVE';
  /** Right to draw given or removed by owner of the room: `{ userId, canEdit }` */
  readonly RIGHTS: 'RIGHTS';
  /**
   * Settings of the room: `{ newUsersCanEdit, encrypted }`, sent by server to its users (`encrypted`: room encrypted end
   * to end), by owner to change them (`newUsersCanEdit`)
   */
  readonly ROOM: 'ROOM';
  /**
   * Message of the user refused by server: `{ event, reason }`, reason `full` (room), `too-big` (drawing) or `key`
   * (key of an encrypted room missing or wrong)
   */
  readonly REJECTED: 'REJECTED';
  /**
   * Area of the drawing shown by the owner presenting it: `{ x, y, width, height, slide }` (drawing coordinates, `slide`:
   * a frame of its slideshow, seen alone), null when the presentation stops; sent by the owner, relayed by server to the
   * room and to users joining meanwhile; encrypted room: `{ data }` (encrypted area)
   */
  readonly VIEW: 'VIEW';
  /**
   * Right to draw asked by a viewer (nothing sent), relayed by server to the owner as `{ userId, name }`; the owner
   * answers `{ userId, accepted }` (accepted: right given), a refusal is sent back to the user as `{ accepted: false }`
   */
  readonly REQUEST: 'REQUEST';
};

/**
 * Largest message a client sends (bytes of its JSON): the server closes the connection of a bigger one (`maxHttpBufferSize`
 * of socket.io), so the library does not send it (a change can hold a whole drawing, shapes JSON escaped in the message)
 */
export declare const maxMessageSize: number;

/**
 * Konva classes of drawing shapes: only these nodes are created from files, links and changes of other users
 */
export declare const shapeClasses: string[];

/**
 * Konva classes of groups of drawing shapes (frames: box, title and content group)
 */
export declare const groupClasses: string[];
