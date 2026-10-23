/**
 * Socket.io events of live collaboration, sent by drawers (`@fabwcie/free-drawing`) and server
 */
export const socketEvents = {
  /** Join a room: `{ room, name, userId, ownerKey, invitedBy }` */
  JOIN: 'JOIN',
  /** Room joined, sent by server to the joining user: `{ userId }` id it gives the user (e.g. of logged in account) */
  JOINED: 'JOINED',
  /** Name of user changed */
  NAME: 'NAME',
  /** Users of the room `{ id, name, owner, canEdit, invitedBy }` (sent by server) */
  USERS: 'USERS',
  /**
   * Drawing change `{ upsert, remove, order, live, full, background }`: shapes added or updated, ids of removed shapes,
   * stacking order, preview of shapes being drawn, whole drawing of the room (sent by server to a joining user, with
   * its background once a user sent one), background color when changed
   */
  CHANGE: 'CHANGE',
  /** Pointer of a user: canvas position (null out of drawer), with user id and name from server */
  POINTER: 'POINTER',
  /** User left the room (id, sent by server) */
  LEAVE: 'LEAVE',
  /** Right to draw given or removed by owner of the room: `{ userId, canEdit }` */
  RIGHTS: 'RIGHTS',
  /** Settings of the room: `{ newUsersCanEdit }`, sent by server to its users, by owner to change them */
  ROOM: 'ROOM',
  /** Message of the user refused by server: `{ event, reason }`, reason `full` (room) or `too-big` (drawing) */
  REJECTED: 'REJECTED',
  /**
   * Area of the drawing shown by the owner presenting it: `{ x, y, width, height }` (drawing coordinates), null when
   * the presentation stops; sent by the owner, relayed by server to the room and to users joining meanwhile
   */
  VIEW: 'VIEW',
  /**
   * Right to draw asked by a viewer (nothing sent), relayed by server to the owner as `{ userId, name }`; the owner
   * answers `{ userId, accepted }` (accepted: right given), a refusal is sent back to the user as `{ accepted: false }`
   */
  REQUEST: 'REQUEST',
};

/**
 * Konva classes of drawing shapes: only these nodes are created from files, links and changes of other users
 */
export const shapeClasses = ['Line', 'Arrow', 'Rect', 'Ellipse', 'Text', 'Path'];

/**
 * Konva classes of groups of drawing shapes (frames: box, title and content group)
 */
export const groupClasses = ['Group', 'Frame'];
