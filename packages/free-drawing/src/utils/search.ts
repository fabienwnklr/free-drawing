import type { Container } from 'konva/lib/Container';
import type { Node } from 'konva/lib/Node';
import { Text } from 'konva/lib/shapes/Text';
import { shapeName } from '@/constants';
import { getFrameOfTitle } from '@/utils/frame';
import { inReadingOrder } from '@/utils/slides';

/** Accents of decomposed letters (U+0300 to U+036F) */
const accents = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g');

/**
 * Text compared with a search: lower case, without accents
 * @param text Search, text of the drawing or of a command (label, group, id)
 * @returns Text decomposed (NFD), without accents, in lower case
 */
export const normalizeSearch = (text: string) => text.normalize('NFD').replace(accents, '').toLowerCase();

/**
 * Texts of a drawing containing a search (case and accents ignored): free texts, texts of shapes and labels of arrows,
 * titles of frames; visible ones, in reading order (rows from top to bottom, each one from left to right)
 * @param layer Draw layer
 * @param search Searched text (spaces around it ignored)
 * @returns Texts found, none for an empty search
 */
export function findTexts(layer: Container, search: string): Text[] {
  const wanted = normalizeSearch(search.trim());

  if (!wanted) return [];

  const found = layer.find<Text>(
    (node: Node) =>
      node instanceof Text &&
      (node.hasName(shapeName.text) || !!getFrameOfTitle(node)) &&
      node.isVisible() &&
      normalizeSearch(node.text()).includes(wanted)
  );

  // rows by the middle of their texts (as keyboard navigation and slides), not by their exact top
  return inReadingOrder(found, (text) => text.getClientRect({ relativeTo: layer }));
}
