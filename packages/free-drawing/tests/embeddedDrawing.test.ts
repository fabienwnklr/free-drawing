import { describe, expect, it } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { shapeName } from '@/constants';
import { parseDrawingFile } from '@/utils/drawingFile';
import { embedDrawingInPng, embedDrawingInSvg, readDrawingFile } from '@/utils/embeddedDrawing';
import { createDrawer } from './helpers';

/**
 * CRC-32 computed bit by bit (not as the library does, with a table): checksum of PNG chunks
 * @param bytes Type and data of a chunk
 * @returns Unsigned checksum
 */
const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
};

/**
 * PNG chunk: length, type, data, checksum
 * @param type Type of the chunk
 * @param data Data of the chunk
 * @returns Bytes of the chunk
 */
const chunk = (type: string, data: number[] = []) => {
  const body = new Uint8Array([...new TextEncoder().encode(type), ...data]);
  const bytes = new Uint8Array(body.length + 8);
  const view = new DataView(bytes.buffer);

  view.setUint32(0, data.length);
  bytes.set(body, 4);
  view.setUint32(body.length + 4, crc32(body));
  return bytes;
};

/** Smallest PNG file: signature, header of a 1 × 1 image, end (no pixels: enough for its chunks) */
const png = () =>
  new Blob(
    [
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', [0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]),
      chunk('IEND'),
    ],
    { type: 'image/png' }
  );

/**
 * Types of the chunks of a PNG image, each one checked
 * @param blob PNG image
 * @returns Types in order, with the validity of their checksum
 */
const chunks = async (blob: Blob) => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const found: string[] = [];

  for (let offset = 8; offset < bytes.length; ) {
    const length = view.getUint32(offset);
    const body = bytes.subarray(offset + 4, offset + 8 + length);
    const valid = view.getUint32(offset + 8 + length) === crc32(body);

    found.push(`${new TextDecoder().decode(body.subarray(0, 4))}${valid ? '' : ' (bad checksum)'}`);
    offset += length + 12;
  }
  return found;
};

const json = JSON.stringify({ type: 'free-drawing', version: 1, background: '#fff', shapes: [], note: 'é ✓' });

describe('Drawing kept in exported images', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('PNG: text chunk before the end, valid checksum, drawing read back', async () => {
    const image = await embedDrawingInPng(png(), json);

    // checksum of the end of every PNG file
    expect(crc32(new TextEncoder().encode('IEND'))).toBe(0xae426082);
    expect(image.type).toBe('image/png');
    expect(await chunks(image)).toEqual(['IHDR', 'tEXt', 'IEND']);
    expect(await readDrawingFile(image)).toBe(json);
  });

  it('SVG: metadata at the start of the image, drawing read back; drawing files read as they are', async () => {
    const svg = await embedDrawingInSvg('<svg xmlns="http://www.w3.org/2000/svg" width="10"><rect/></svg>', json);

    expect(svg).toMatch(
      /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="10"><metadata id="free-drawing">[\w-]+<\/metadata><rect\/>/
    );
    expect(await readDrawingFile(new Blob([svg]))).toBe(json);
    // with an xml declaration
    expect(await readDrawingFile(new Blob([`<?xml version="1.0"?>\n${svg}`]))).toBe(json);
    expect(await readDrawingFile(new Blob([json]))).toBe(json);
  });

  it('Image without drawing, or damaged one: error of the library', async () => {
    const error = { name: 'DrawerError', key: 'error.noDrawingInImage' };

    await expect(readDrawingFile(png())).rejects.toMatchObject(error);
    await expect(readDrawingFile(new Blob(['<svg><rect/></svg>']))).rejects.toMatchObject(error);
    await expect(
      readDrawingFile(new Blob(['<svg><metadata id="free-drawing">zbroken</metadata></svg>']))
    ).rejects.toMatchObject(error);
  });

  it('SVG export of the drawer keeps its exported shapes with the option, opened again as a drawing', async () => {
    const drawer = createDrawer();

    drawer.addShape(new Rect({ name: shapeName.rect, width: 100, height: 50, stroke: '#e03131' }));
    drawer.addShape(new Rect({ name: shapeName.rect, x: 300, width: 40, height: 40, stroke: '#000' }));

    const plain = await (await drawer.exportImage('svg')).text();
    const kept = await drawer.exportImage('svg', { withDrawing: true });

    expect(plain).not.toContain('<metadata');
    const file = parseDrawingFile(await readDrawingFile(kept));
    expect(file.shapes).toHaveLength(2);
    expect(file.shapes[0].attrs).toMatchObject({ stroke: '#e03131', width: 100 });

    // opened in another drawer
    const other = createDrawer();
    other.loadDrawing(await readDrawingFile(kept));
    expect(other.getDrawingShapes()).toHaveLength(2);
  });
});
