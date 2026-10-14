/**
 * Socket.io events of live collaboration, sent by drawers (`@fabwcie/free-drawing`) and server
 */
export declare const socketEvents: {
  /** Join a room: `{ room, name, userId, ownerKey, invitedBy }` */
  readonly JOIN: 'JOIN';
  /** Name of user changed */
  readonly NAME: 'NAME';
  /** Users of the room `{ id, name, owner, canEdit, invitedBy }` (sent by server) */
  readonly USERS: 'USERS';
  /** Drawing change `{ upsert, remove, order, live }`: shapes added or updated, ids of removed shapes, stacking order */
  readonly CHANGE: 'CHANGE';
  /** Pointer of a user: canvas position (null out of drawer), with user id and name from server */
  readonly POINTER: 'POINTER';
  /** User left the room (id, sent by server) */
  readonly LEAVE: 'LEAVE';
  /** Right to draw given or removed by owner of the room: `{ userId, canEdit }` */
  readonly RIGHTS: 'RIGHTS';
};
