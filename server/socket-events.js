export const socketEvents = {
  // join a room: { room, name }
  JOIN: 'JOIN',
  // name of user changed
  NAME: 'NAME',
  // names of users of the room, sent by server
  USERS: 'USERS',
  // drawing change: { upsert: shapes JSON, remove: ids }
  CHANGE: 'CHANGE',
};
