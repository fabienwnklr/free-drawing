import { describe, expect, it, vi } from 'vitest';
import { RoomCipher, createRoomKey, createSecret, decryptChange, encryptChange } from '@/utils/encryption';
import type { DrawingChange } from '@/@types/collaboration';

/** Image file of 1 x 1 pixel */
const pngData =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const rect = (id: string, text = 'secret plan') => JSON.stringify({ attrs: { id, label: text }, className: 'Rect' });

describe('End-to-end encryption of collaboration', () => {
  it('Keys of rooms: 128 bits in base64url, proof for the server without the key, cut or changed keys refused', async () => {
    const key = await createRoomKey();
    const other = await createRoomKey();

    expect(key).toMatch(/^[\w-]{22}$/);
    expect(other).not.toBe(key);

    const cipher = await RoomCipher.create(key);

    expect(cipher.key).toBe(key);
    // SHA-256: the same for the same key, never the key
    expect(cipher.keyCheck).toMatch(/^[\w-]{43}$/);
    expect((await RoomCipher.create(key)).keyCheck).toBe(cipher.keyCheck);
    expect((await RoomCipher.create(other)).keyCheck).not.toBe(cipher.keyCheck);
    expect(cipher.keyCheck).not.toContain(key);

    const error = { name: 'DrawerError', key: 'error.roomKey' };

    await expect(RoomCipher.create(key.slice(0, 20))).rejects.toMatchObject(error);
    await expect(RoomCipher.create(`${key.slice(0, 21)}!`)).rejects.toMatchObject(error);
    await expect(RoomCipher.create('')).rejects.toMatchObject(error);
  });

  it('Secrets of 128 bits from the random values of Web Crypto, never from Math.random', () => {
    const random = vi.spyOn(Math, 'random');
    const getRandomValues = vi.spyOn(crypto, 'getRandomValues');

    try {
      const secret = createSecret();

      expect(secret).toMatch(/^[\w-]{22}$/);
      expect(createSecret()).not.toBe(secret);
      expect(getRandomValues).toHaveBeenCalledTimes(2);
      expect(random).not.toHaveBeenCalled();
    } finally {
      random.mockRestore();
      getRandomValues.mockRestore();
    }
  });

  it('Messages encrypted with a random vector: read with the same key only, changed ones refused', async () => {
    const cipher = await RoomCipher.create(await createRoomKey());
    const other = await RoomCipher.create(await createRoomKey());
    const data = await cipher.encrypt('Hello é ✓');

    expect(data).toMatch(/^[\w-]+$/);
    expect(data).not.toContain('Hello');
    // same text, other data
    expect(await cipher.encrypt('Hello é ✓')).not.toBe(data);
    expect(await cipher.decrypt(data)).toBe('Hello é ✓');
    expect(await cipher.decryptJson(await cipher.encryptJson({ x: 1, y: null }))).toEqual({ x: 1, y: null });

    await expect(other.decrypt(data)).rejects.toThrow();
    // a character changed
    await expect(
      cipher.decrypt(`${data.slice(0, -2)}${data.at(-2) === 'A' ? 'B' : 'A'}${data.at(-1)}`)
    ).rejects.toThrow();
    await expect(cipher.decrypt('short')).rejects.toThrow();
    await expect(cipher.decrypt(42)).rejects.toThrow();
  });

  it('Changes: ids in clear, shapes, files and background encrypted, read back; parts of another key dropped', async () => {
    const cipher = await RoomCipher.create(await createRoomKey());
    const change: DrawingChange = {
      upsert: [rect('r1'), rect('r2')],
      remove: ['r0'],
      order: ['r1', 'r2'],
      background: '#f5faff',
      files: { 'file-1': pngData },
    };
    const encrypted = await encryptChange(cipher, change);
    const json = JSON.stringify(encrypted);

    expect(encrypted.upsert.map((shape) => shape.id)).toEqual(['r1', 'r2']);
    expect(encrypted).toMatchObject({ remove: ['r0'], order: ['r1', 'r2'] });
    // nothing of the drawing readable: texts, colors, images, ids of files
    for (const clear of ['secret plan', '#f5faff', 'iVBORw0K', 'file-1', 'Rect']) expect(json).not.toContain(clear);
    expect(Object.keys(encrypted.files!)).toHaveLength(1);

    expect(await decryptChange(cipher, encrypted)).toEqual({ change, failed: 0 });

    // live preview without files nor background
    const live = await encryptChange(cipher, { upsert: [rect('r3')], remove: [], live: true });

    expect(Object.keys(live).sort()).toEqual(['live', 'remove', 'upsert']);

    // a shape of another key, a shape under the id of another one, a background in clear: dropped
    const other = await encryptChange(await RoomCipher.create(await createRoomKey()), {
      upsert: [rect('r4')],
      remove: [],
    });
    const { change: read, failed } = await decryptChange(cipher, {
      ...encrypted,
      upsert: [...encrypted.upsert, ...other.upsert, { id: 'r9', data: encrypted.upsert[0].data }, rect('r5')],
      background: '#000',
    });

    expect(failed).toBe(4);
    expect(read.upsert).toEqual(change.upsert);
    expect(read.background).toBeUndefined();

    // not a change
    expect(await decryptChange(cipher, null)).toEqual({ change: { upsert: [] }, failed: 0 });
  });

  it('Image files under ids of the room: the same at each sending (kept once by the server), told with their shapes', async () => {
    const cipher = await RoomCipher.create(await createRoomKey());
    const image = (id: string, fileId: string) => JSON.stringify({ attrs: { id, fileId }, className: 'Image' });
    const group = JSON.stringify({
      attrs: { id: 'g1' },
      className: 'Group',
      children: [{ attrs: { id: 'i2', fileId: 'file-2' }, className: 'Image' }],
    });
    const change: DrawingChange = {
      upsert: [image('i1', 'file-1'), group, rect('r1')],
      remove: [],
      files: { 'file-1': pngData, 'file-2': pngData },
    };
    const first = await encryptChange(cipher, change);
    const again = await encryptChange(cipher, change);
    const fileId = await cipher.fileId('file-1');

    // SHA-256 of the key and the id, another one with another key
    expect(fileId).toMatch(/^[\w-]{43}$/);
    expect(await cipher.fileId('file-1')).toBe(fileId);
    expect(await (await RoomCipher.create(await createRoomKey())).fileId('file-1')).not.toBe(fileId);
    expect(Object.keys(first.files!)).toEqual([fileId, await cipher.fileId('file-2')]);
    expect(Object.keys(again.files!)).toEqual(Object.keys(first.files!));
    // files of each shape, also of the shapes of groups; none for other shapes
    expect(first.upsert.map((shape) => shape.files)).toEqual([[fileId], [await cipher.fileId('file-2')], []]);
    expect(await decryptChange(cipher, first)).toEqual({ change, failed: 0 });
  });
});
