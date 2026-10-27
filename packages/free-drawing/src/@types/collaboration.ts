import type { Socket } from 'socket.io-client';
import type { Vector2d } from 'konva/lib/types';
import type { DrawingFiles } from '@/@types/file';
import type { RoomCipher } from '@/utils/encryption';

/**
 * Collaboration server and data sent on connection (`collaboration` option of the drawer)
 */
export type CollaborationOptions = {
  /** Server url, page origin by default */
  url?: string;
  /** Data read by server on connection (`socket.handshake.auth`, e.g. token of logged in user), or function giving it on each connection */
  auth?: Record<string, unknown> | ((callback: (data: Record<string, unknown>) => void) => void);
  /**
   * End-to-end encryption of new rooms (default true): their key is in the `#` of their links, the server keeps and
   * relays the drawing without reading it; false creates rooms in clear (server reading drawings)
   */
  encrypt?: boolean;
};

/**
 * Session of a `Collaboration`: room to join and identity of this user
 */
export type CollaborationSession = {
  /** Id of the room (`#room=` of links) */
  room: string;
  /** Name shown to other users */
  name: string;
  /** User id, kept between sessions (rights) */
  userId?: string;
  /** Secret of owner of the room, given when the room is created */
  ownerKey?: string;
  /** Id of user who shared the link used to join */
  invitedBy?: string;
  /** Encryption with the key of an encrypted room (`#key=` of its links), none for a room in clear */
  cipher?: RoomCipher;
};

/**
 * Part of a socket.io client socket used by collaboration (connected by the drawer, replaced by fakes in tests)
 */
export type CollaborationSocket = Pick<Socket, 'on' | 'once' | 'emit' | 'disconnect' | 'volatile'>;

/**
 * User of a room (sent by server): owner (created the room) gives or removes the right to draw
 */
export type CollaborationMember = {
  /** Id of the user (account id of a logged in user) */
  id: string;
  /** Name shown to other users */
  name: string;
  /** Created the room: gives or removes the right to draw */
  owner: boolean;
  /** Can draw (right given by the owner), else views only */
  canEdit: boolean;
  /** Name of user who shared the link used to join */
  invitedBy?: string;
};

/**
 * Drawing change sent to other clients: shapes added or updated (konva JSON), ids of removed shapes,
 * `order`: ids of all shapes from bottom to top when stacking order changed,
 * `live`: preview of shapes being drawn or moved (final change follows)
 */
export type DrawingChange = {
  /** Shapes added or updated: konva JSON of top nodes (groups with their shapes) */
  upsert: string[];
  /** Ids of removed shapes */
  remove: string[];
  /** Ids of all shapes from bottom to top, only when stacking order changed */
  order?: string[];
  /** Preview of shapes being drawn or moved: applied without history, the final change follows */
  live?: boolean;
  /** Whole drawing of the room, sent by the server to a joining user (also empty) */
  full?: boolean;
  /** Background color of the drawing, when changed (whole drawing: background of the room, none before a user sends it) */
  background?: string;
  /** Image files not sent yet, used by the shapes (whole drawing: files of the room) */
  files?: DrawingFiles;
};

/** Shape of an encrypted room: id in clear (the server keeps the drawing shape by shape), konva JSON encrypted */
export type EncryptedShape = {
  /** Id of the shape */
  id: string;
  /** Konva JSON of the shape, encrypted (see `RoomCipher.encrypt`) */
  data: string;
};

/**
 * Drawing change of an encrypted room (`CHANGE`): ids of shapes and flags in clear, shapes, image files and background
 * encrypted
 */
export type EncryptedChange = Omit<DrawingChange, 'upsert' | 'background' | 'files'> & {
  /** Shapes added or updated, encrypted */
  upsert: EncryptedShape[];
  /** Background color, encrypted */
  background?: string;
  /** Image files, each one encrypted with its id, under a random id (the server can't tell which image it is) */
  files?: Record<string, string>;
};

/** Change of an encrypted room once decrypted */
export type DecryptedChange = {
  /** Change as in a room in clear, without the parts not decrypted */
  change: DrawingChange;
  /** Parts not decrypted (shapes, files, background): encrypted with another key, or changed */
  failed: number;
};

/** Pointer position or view of an encrypted room (`POINTER`, `VIEW`): its JSON encrypted */
export type EncryptedMessage = {
  /** JSON of the message, encrypted */
  data: string;
};

/**
 * Position of a pointer in the drawing, sent to other users with the laser while it is pressed
 */
export type PointerPosition = Vector2d & {
  /** Laser pressed: trail of the color of the user follows the pointer */
  laser?: boolean;
};

/** Pointer of another user: position in drawing (null out of drawer), laser used */
export type RemotePointer = {
  /** Id of the user, identifies their cursor and laser trail */
  id: string;
  /** Name shown in their cursor (anonymous when empty) */
  name?: string;
  /** Position in drawing, null when the pointer left the drawer (cursor hidden); missing in an encrypted room */
  position?: PointerPosition | null;
  /** Position encrypted (`PointerPosition` or null), in an encrypted room */
  data?: unknown;
};

/** Room joined (`JOINED`, sent by the server to the joining user), checked on reception */
export type JoinedMessage = {
  /** Id given to this user (account of a logged in user) */
  userId?: unknown;
};

/** Settings of the room (`ROOM`, sent by the server on join and change), checked on reception */
export type RoomMessage = {
  /** Users coming for the first time can draw, else they view only */
  newUsersCanEdit?: unknown;
  /** The room is encrypted end to end (servers of previous versions: none) */
  encrypted?: unknown;
};

/** Message of this user refused by the server (`REJECTED`), checked on reception */
export type RejectedMessage = {
  /** Event of the refused message (`JOIN`, `CHANGE`) */
  event?: unknown;
  /** `full`: room full, `too-big`: drawing too big, `key`: key of the encrypted room missing or wrong */
  reason?: unknown;
};

/** Area of the drawing, in drawing coordinates: view presented by the owner (`VIEW`), see `Drawer.getViewArea` */
export type ViewArea = {
  /** Left of the area */
  x: number;
  /** Top of the area */
  y: number;
  /** Width of the area */
  width: number;
  /** Height of the area */
  height: number;
};

/**
 * View presented by the owner (`VIEW`): area of its view, or of the slide (frame) it shows during a slideshow, which
 * other users see alone (around it masked)
 */
export type PresentedView = ViewArea & {
  /** Area of a slide: a frame presented, shown alone */
  slide?: boolean;
};

/** Viewer asking the owner for the right to draw, waiting for its answer */
export type AccessRequest = {
  /** Id of the user */
  userId: string;
  /** Name of the user */
  name: string;
};

/**
 * Request of the right to draw (`REQUEST`): sent by the server to the owner (user asking), to the user when it is
 * refused; checked on reception
 */
export type RequestMessage = {
  /** Id of the user asking */
  userId?: unknown;
  /** Name of the user asking */
  name?: unknown;
  /** Answer of the owner: false when refused */
  accepted?: unknown;
};
