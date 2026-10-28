import { fromBase64Url, toBase64Url } from '@/utils/drawingFile';
import { DrawerError } from '@/utils/errors';
import type { DecryptedChange, DrawingChange, EncryptedChange, EncryptedShape } from '@/@types/collaboration';
import type { ShapeState } from '@/@types/file';

/**
 * End-to-end encryption of live collaboration: the creator of a room makes its key (AES-GCM, 128 bits), given in the
 * `#` of its links (browsers never send it to servers). Shapes, image files, background, pointers and presented views
 * are encrypted with it before they are sent: the server keeps and relays them without reading them
 */

/** Key of a room in links: 128 bits in base64url */
export const roomKeyPattern = /^[\w-]{22}$/;

/** Bytes of the random initialization vector put before each encrypted message (AES-GCM) */
const ivLength = 12;

/**
 * Web Crypto of the browser, only on secure pages (https, localhost)
 * @returns Subtle crypto of the browser
 * @throws {DrawerError} `error.insecurePage` on a page without it
 */
function getSubtle(): SubtleCrypto {
  if (!globalThis.crypto?.subtle) {
    throw new DrawerError('error.insecurePage', 'end-to-end encryption needs Web Crypto: secure page (https) only');
  }
  return crypto.subtle;
}

/**
 * Secret that can't be guessed (id of a room, secret of its owner, secret of the browser of a user): random bytes of
 * `crypto.getRandomValues`, also on pages without Web Crypto (not https), unlike `Math.random` whose outputs can be
 * found again from the ids of shapes
 * @returns 128 random bits in base64url (22 characters)
 */
export function createSecret(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
}

/**
 * New key of an encrypted room
 * @returns Key of 128 bits in base64url (22 characters), put in the links of the room
 * @throws {DrawerError} `error.insecurePage` on a page without Web Crypto
 */
export async function createRoomKey(): Promise<string> {
  const subtle = getSubtle();
  const key = await subtle.generateKey({ name: 'AES-GCM', length: 128 }, true, ['encrypt', 'decrypt']);

  return toBase64Url(new Uint8Array(await subtle.exportKey('raw', key)));
}

/**
 * Encryption of the messages of a room with its key: AES-GCM, a random initialization vector per message, so a message
 * changed or encrypted with another key is not decrypted
 */
export class RoomCipher {
  /** Key of the room in base64url, put in its links */
  readonly key: string;
  /**
   * Proof of the key given to the server when joining (SHA-256 of the key): users with another key, or none, are
   * refused, the key can't be found from it
   */
  readonly keyCheck: string;
  /** Key of Web Crypto, not extractable */
  readonly #cryptoKey: CryptoKey;

  /**
   * Cipher of a key already imported, see `create`
   * @param key Key of the room in base64url
   * @param keyCheck Proof of the key for the server
   * @param cryptoKey Key of Web Crypto
   */
  private constructor(key: string, keyCheck: string, cryptoKey: CryptoKey) {
    this.key = key;
    this.keyCheck = keyCheck;
    this.#cryptoKey = cryptoKey;
  }

  /**
   * Cipher of a room
   * @param key Key of the room (22 characters of base64url), from its link
   * @returns Cipher ready to encrypt and decrypt
   * @throws {DrawerError} `error.roomKey` for a key cut or changed, `error.insecurePage` on a page without Web Crypto
   */
  static async create(key: string): Promise<RoomCipher> {
    if (!roomKeyPattern.test(key)) throw new DrawerError('error.roomKey', 'key of the room missing or invalid');

    const subtle = getSubtle();
    const cryptoKey = await subtle.importKey('raw', fromBase64Url(key), 'AES-GCM', false, ['encrypt', 'decrypt']);
    const hash = await subtle.digest('SHA-256', new TextEncoder().encode(`free-drawing room key ${key}`));

    return new RoomCipher(key, toBase64Url(new Uint8Array(hash)), cryptoKey);
  }

  /**
   * Text encrypted with the key of the room
   * @param text Text to encrypt
   * @returns Initialization vector and encrypted text, in base64url
   */
  async encrypt(text: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(ivLength));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.#cryptoKey,
      new TextEncoder().encode(text)
    );
    const bytes = new Uint8Array(ivLength + encrypted.byteLength);

    bytes.set(iv);
    bytes.set(new Uint8Array(encrypted), ivLength);
    return toBase64Url(bytes);
  }

  /**
   * Text decrypted with the key of the room
   * @param data Data of `encrypt` (not trusted)
   * @returns Decrypted text
   * @throws {Error} data not encrypted with this key, changed, or not encrypted data
   */
  async decrypt(data: unknown): Promise<string> {
    if (typeof data !== 'string') throw new TypeError('not encrypted data');

    const bytes = fromBase64Url(data);

    if (bytes.length <= ivLength) throw new TypeError('not encrypted data');

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bytes.subarray(0, ivLength) },
      this.#cryptoKey,
      bytes.subarray(ivLength)
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Value encrypted as JSON
   * @param value Value to encrypt (pointer position, view...)
   * @returns Encrypted JSON, see `encrypt`
   */
  encryptJson(value: unknown): Promise<string> {
    return this.encrypt(JSON.stringify(value));
  }

  /**
   * Value of encrypted JSON
   * @param data Data of `encryptJson` (not trusted)
   * @returns Decrypted value, to check
   * @throws {Error} data not encrypted with this key, changed, or not JSON
   */
  async decryptJson(data: unknown): Promise<unknown> {
    return JSON.parse(await this.decrypt(data));
  }

  /**
   * Id of an image file in the messages of the room: the same for the same file, so the server keeps it once, and the
   * id of the file (hash of the image) can't be found from it without the key
   * @param id Id of the file
   * @returns SHA-256 of the key and the id, in base64url (43 characters)
   */
  async fileId(id: string): Promise<string> {
    const hash = await getSubtle().digest('SHA-256', new TextEncoder().encode(`free-drawing file ${this.key} ${id}`));

    return toBase64Url(new Uint8Array(hash));
  }
}

/**
 * Image files used by a shape state: images of groups and frames too
 * @param state State of a shape (konva JSON)
 * @returns Ids of the files of its images
 */
function fileIdsOf(state: ShapeState): string[] {
  const { fileId } = state.attrs;

  return [...(typeof fileId === 'string' ? [fileId] : []), ...(state.children ?? []).flatMap(fileIdsOf)];
}

/**
 * Change of the drawing encrypted for an encrypted room: ids of shapes, removed shapes and stacking order in clear (the
 * server keeps the drawing shape by shape), shapes, image files and background encrypted
 * @param cipher Cipher of the room
 * @param change Change to send
 * @returns Change to send to the server
 */
export async function encryptChange(
  cipher: RoomCipher,
  { upsert, background, files, ...change }: DrawingChange
): Promise<EncryptedChange> {
  const [shapes, encryptedFiles, encryptedBackground] = await Promise.all([
    Promise.all(
      upsert.map(async (json): Promise<EncryptedShape> => {
        const state = JSON.parse(json) as ShapeState;

        return {
          id: String(state.attrs.id),
          data: await cipher.encrypt(json),
          // files it uses (also none): the server releases the files of no shape
          files: await Promise.all(fileIdsOf(state).map((id) => cipher.fileId(id))),
        };
      })
    ),
    // under ids of the room: the id of a file is the hash of the image
    Promise.all(
      Object.entries(files ?? {}).map(async ([id, data]) => [
        await cipher.fileId(id),
        await cipher.encryptJson({ id, data }),
      ])
    ),
    background === undefined ? undefined : cipher.encrypt(background),
  ]);

  return {
    ...change,
    upsert: shapes,
    ...(encryptedFiles.length > 0 && { files: Object.fromEntries(encryptedFiles) }),
    ...(encryptedBackground !== undefined && { background: encryptedBackground }),
  };
}

/**
 * Change of an encrypted room decrypted: shapes, files and background encrypted with another key, or changed, are
 * dropped (other parts are checked when applied, as in rooms in clear)
 * @param cipher Cipher of the room
 * @param message Change received from the server (not trusted)
 * @returns Change as in a room in clear, with the number of parts not decrypted
 */
export async function decryptChange(cipher: RoomCipher, message: unknown): Promise<DecryptedChange> {
  const { upsert, background, files, ...change } = (typeof message === 'object' && message ? message : {}) as Record<
    string,
    unknown
  >;
  let failed = 0;

  /**
   * Part of the change decrypted, null when it can't be
   * @param read Decrypts and checks the part
   * @returns Decrypted part, null when not decrypted
   */
  const decrypt = async <T>(read: () => Promise<T>): Promise<T | null> => {
    try {
      return await read();
    } catch {
      failed++;
      return null;
    }
  };

  const [shapes, decryptedFiles, color] = await Promise.all([
    Promise.all(
      (Array.isArray(upsert) ? upsert : []).map((shape: Partial<EncryptedShape> | null) =>
        decrypt(async () => {
          const json = await cipher.decrypt(shape?.data);

          // id in clear: the one of the shape (else it would replace another shape)
          if (JSON.parse(json)?.attrs?.id !== shape?.id) throw new Error('id of the shape changed');
          return json;
        })
      )
    ),
    Promise.all(
      Object.values(typeof files === 'object' && files ? files : {}).map((data) =>
        decrypt(async () => {
          const file = (await cipher.decryptJson(data)) as Record<string, unknown> | null;

          // id and data checked when added
          return [String(file?.id), file?.data] as const;
        })
      )
    ),
    background === undefined ? undefined : decrypt(() => cipher.decrypt(background)),
  ]);
  const validFiles = decryptedFiles.filter((file) => file !== null);

  return {
    change: {
      ...(change as Omit<DrawingChange, 'upsert'>),
      upsert: shapes.filter((json) => json !== null),
      ...(validFiles.length > 0 && { files: Object.fromEntries(validFiles) as DrawingChange['files'] }),
      ...(typeof color === 'string' && { background: color }),
    },
    failed,
  };
}
