/**
 * Socket.io events of live collaboration, sent by drawers (`@fabwcie/free-drawing`) and server
 */
export declare const socketEvents: {
  /** Join a room: `{ room, name, userId, ownerKey, invitedBy }` */
  readonly JOIN: 'JOIN';
  /** Room joined, sent by server to the joining user: `{ userId }` id it gives the user (e.g. of logged in account) */
  readonly JOINED: 'JOINED';
  /** Name of user changed */
  readonly NAME: 'NAME';
  /** Users of the room `{ id, name, owner, canEdit, invitedBy }` (sent by server) */
  readonly USERS: 'USERS';
  /**
   * Drawing change `{ upsert, remove, order, live, full }`: shapes added or updated, ids of removed shapes, stacking
   * order, preview of shapes being drawn, whole drawing of the room (sent by server to a joining user)
   */
  readonly CHANGE: 'CHANGE';
  /** Pointer of a user: canvas position `{ x, y, laser }` (null out of drawer, `laser` while laser pointer is used), with user id and name from server */
  readonly POINTER: 'POINTER';
  /** User left the room (id, sent by server) */
  readonly LEAVE: 'LEAVE';
  /** Right to draw given or removed by owner of the room: `{ userId, canEdit }` */
  readonly RIGHTS: 'RIGHTS';
  /** Settings of the room: `{ newUsersCanEdit }`, sent by server to its users, by owner to change them */
  readonly ROOM: 'ROOM';
  /** Message of the user refused by server: `{ event, reason }`, reason `full` (room) or `too-big` (drawing) */
  readonly REJECTED: 'REJECTED';
  /**
   * Area of the drawing shown by the owner presenting it: `{ x, y, width, height }` (drawing coordinates), null when
   * the presentation stops; sent by the owner, relayed by server to the room and to users joining meanwhile
   */
  readonly VIEW: 'VIEW';
  /**
   * Right to draw asked by a viewer (nothing sent), relayed by server to the owner as `{ userId, name }`; the owner
   * answers `{ userId, accepted }` (accepted: right given), a refusal is sent back to the user as `{ accepted: false }`
   */
  readonly REQUEST: 'REQUEST';
};

/**
 * Konva classes of drawing shapes: only these nodes are created from files, links and changes of other users
 */
export declare const shapeClasses: string[];

/**
 * Konva classes of groups of drawing shapes (frames: box, title and content group)
 */
export declare const groupClasses: string[];
