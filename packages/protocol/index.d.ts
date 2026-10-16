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
  /** Drawing change `{ upsert, remove, order, live }`: shapes added or updated, ids of removed shapes, stacking order */
  readonly CHANGE: 'CHANGE';
  /** Pointer of a user: canvas position `{ x, y, laser }` (null out of drawer, `laser` while laser pointer is used), with user id and name from server */
  readonly POINTER: 'POINTER';
  /** User left the room (id, sent by server) */
  readonly LEAVE: 'LEAVE';
  /** Right to draw given or removed by owner of the room: `{ userId, canEdit }` */
  readonly RIGHTS: 'RIGHTS';
  /** Settings of the room: `{ newUsersCanEdit }`, sent by server to its users, by owner to change them */
  readonly ROOM: 'ROOM';
};
