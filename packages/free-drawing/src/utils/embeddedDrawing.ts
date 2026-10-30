import { decodeLinkData, encodeLinkData } from '@/utils/drawingFile';
import { DrawerError } from '@/utils/errors';

/**
 * Drawing kept in exported images, to open them again for editing: data of `encodeLinkData` (compressed drawing file,
 * base64url) in a `tEXt` chunk of PNG images (keyword `free-drawing`), in a `<metadata id="free-drawing">` element of
 * SVG images
 */

/** Keyword of the PNG text chunk and id of the SVG metadata holding the drawing */
const embedKey = 'free-drawing';

/** Signature of PNG files */
const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Table of CRC-32 of bytes (checksum of PNG chunks), computed on first use */
let crcTable: Uint32Array | null = null;

/**
 * CRC-32 of bytes, as PNG chunks need it
 * @param bytes Type and data of a chunk
 * @returns Unsigned checksum
 */
function crc32(bytes: Uint8Array): number {
  crcTable ??= Uint32Array.from({ length: 256 }, (_, n) => {
    let c = n;

    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });

  let crc = 0xffffffff;

  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Bytes are a PNG image
 * @param bytes Content of a file
 * @returns True when they start with the PNG signature
 */
const isPng = (bytes: Uint8Array) => pngSignature.every((byte, i) => bytes[i] === byte);

/**
 * PNG image keeping a drawing: text chunk added before its end
 * @param png PNG image (exported drawing)
 * @param json JSON of the drawing file
 * @returns PNG image with the drawing
 */
export async function embedDrawingInPng(png: Blob, json: string): Promise<Blob> {
  const bytes = new Uint8Array(await png.arrayBuffer());
  // keyword, separator, text (ASCII: base64url)
  const data = new TextEncoder().encode(`${embedKey}\0${await encodeLinkData(json)}`);
  const chunk = new Uint8Array(data.length + 12);
  const view = new DataView(chunk.buffer);

  view.setUint32(0, data.length);
  chunk.set(new TextEncoder().encode('tEXt'), 4);
  chunk.set(data, 8);
  view.setUint32(data.length + 8, crc32(chunk.subarray(4, data.length + 8)));

  // last chunk: IEND (12 bytes)
  const end = bytes.length - 12;

  return new Blob([bytes.subarray(0, end), chunk, bytes.subarray(end)], { type: 'image/png' });
}

/**
 * SVG image keeping a drawing: metadata element at its start
 * @param svg SVG image (exported drawing)
 * @param json JSON of the drawing file
 * @returns SVG image with the drawing
 */
export async function embedDrawingInSvg(svg: string, json: string): Promise<string> {
  const metadata = `<metadata id="${embedKey}">${await encodeLinkData(json)}</metadata>`;

  // after the opening tag of the svg element
  return svg.replace(/^(<svg[^>]*>)/, `$1${metadata}`);
}

/**
 * Data of the drawing kept in a PNG image
 * @param bytes Content of the PNG file
 * @returns Data of `encodeLinkData`, null without
 */
function readPngData(bytes: Uint8Array): string | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder('latin1');

  // chunks after the signature: length, type, data, checksum
  for (let offset = pngSignature.length; offset + 12 <= bytes.length; ) {
    const length = view.getUint32(offset);
    const type = decoder.decode(bytes.subarray(offset + 4, offset + 8));

    if (type === 'IEND') break;
    if (type === 'tEXt') {
      const data = bytes.subarray(offset + 8, offset + 8 + length);
      const separator = data.indexOf(0);

      if (separator > 0 && decoder.decode(data.subarray(0, separator)) === embedKey) {
        return decoder.decode(data.subarray(separator + 1));
      }
    }
    offset += length + 12;
  }
  return null;
}

/**
 * JSON of a drawing file chosen to be opened: a drawing file, or a PNG or SVG image keeping its drawing
 * @param file File chosen by the user
 * @returns JSON of the drawing file (checked when loaded)
 * @throws {DrawerError} image without drawing, or its drawing damaged or too big
 */
export async function readDrawingFile(file: Blob): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const text = isPng(bytes) ? null : new TextDecoder().decode(bytes);
  const isSvg = text !== null && /^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/.test(text);

  // drawing file (JSON)
  if (text !== null && !isSvg) return text;

  const data = isSvg
    ? new RegExp(`<metadata id="${embedKey}">([\\w-]+)</metadata>`).exec(text)?.[1] ?? null
    : readPngData(bytes);

  if (!data) throw new DrawerError('error.noDrawingInImage', 'image without drawing');

  try {
    return await decodeLinkData(data);
  } catch (error) {
    if (error instanceof DrawerError && error.key === 'error.drawingTooBig') throw error;
    throw new DrawerError('error.noDrawingInImage', 'damaged drawing in image', { cause: error });
  }
}
