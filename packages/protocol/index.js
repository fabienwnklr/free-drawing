/**
 * Socket.io events of live collaboration, sent by drawers (`@fabwcie/free-drawing`) and server
 */
export const socketEvents = {
  /**
   * Join a room: `{ room, name, userId, userKey, ownerKey, invitedBy, keyCheck }`, `userKey` secret of the browser of the
   * user (its id is given to the browser giving the same secret only), `keyCheck` proof of the key of an encrypted room
   * (SHA-256 of the key, base64url): the room is encrypted by the user creating it, joined with the same proof only
   */
  JOIN: 'JOIN',
  /** Room joined, sent by server to the joining user: `{ userId }` id it gives the user (e.g. of logged in account) */
  JOINED: 'JOINED',
  /** Name of user changed */
  NAME: 'NAME',
  /** Users of the room `{ id, name, owner, canEdit, invitedBy }` (sent by server) */
  USERS: 'USERS',
  /**
   * Drawing change `{ upsert, remove, order, live, full, kept, background, files }`: shapes added or updated, ids of
   * removed shapes, stacking order, preview of shapes being drawn, whole drawing of the room (sent by server to a joining
   * user, with its background once a user sent one; `kept` when users sent it since the room was created or dropped: an
   * empty one was emptied by them), background color when changed, image files by id (released by the server when no
   * shape uses them and the drawing would be too big). Acknowledged by the server once received (applied or refused):
   * a change sent while the connection was lost unseen is sent again once joined. Encrypted room: `upsert` is `{ id, data, files }` (encrypted
   * JSON, ids of the files it uses), `background` and `files` (under ids of the room: SHA-256 of the key and the id)
   * encrypted, not read by the server
   */
  CHANGE: 'CHANGE',
  /**
   * Pointer of a user: canvas position `{ x, y, laser }` (null out of drawer, `laser` while laser pointer is used), with
   * user id and name from server; encrypted room: `{ data }` (encrypted position)
   */
  POINTER: 'POINTER',
  /** User left the room (id, sent by server) */
  LEAVE: 'LEAVE',
  /** Right to draw given or removed by owner of the room: `{ userId, canEdit }` */
  RIGHTS: 'RIGHTS',
  /**
   * Settings of the room: `{ newUsersCanEdit, encrypted }`, sent by server to its users (`encrypted`: room encrypted end
   * to end), by owner to change them (`newUsersCanEdit`)
   */
  ROOM: 'ROOM',
  /**
   * Message of the user refused by server: `{ event, reason }`, reason `full` (room), `too-big` (drawing), `right`
   * (change of a user without right to draw) or `key` (key of an encrypted room missing or wrong); a refused change
   * gives the ids of its shapes `{ upsert, remove }` (sent again later)
   */
  REJECTED: 'REJECTED',
  /**
   * Area of the drawing shown by the owner presenting it: `{ x, y, width, height, slide }` (drawing coordinates, `slide`:
   * a frame of its slideshow, seen alone), null when the presentation stops; sent by the owner, relayed by server to the
   * room and to each user joining (null without presentation); encrypted room: `{ data }` (encrypted area)
   */
  VIEW: 'VIEW',
  /**
   * Right to draw asked by a viewer (nothing sent), relayed by server to the owner as `{ userId, name }`; the owner
   * answers `{ userId, accepted }` (accepted: right given), a refusal is sent back to the user as `{ accepted: false }`
   */
  REQUEST: 'REQUEST',
};

/**
 * Largest message a client sends (bytes of its JSON): the server closes the connection of a bigger one (`maxHttpBufferSize`
 * of socket.io), so the library does not send it (a change can hold a whole drawing, shapes JSON escaped in the message)
 */
export const maxMessageSize = 10_000_000;

/**
 * Konva classes of drawing shapes: only these nodes are created from files, links and changes of other users
 */
export const shapeClasses = ['Line', 'Arrow', 'Rect', 'Ellipse', 'Text', 'Path', 'Image'];

/**
 * Konva classes of groups of drawing shapes (frames: box, title and content group)
 */
export const groupClasses = ['Group', 'Frame'];
