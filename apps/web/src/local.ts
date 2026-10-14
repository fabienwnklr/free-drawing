import type { DrawingFile } from '@fabwcie/free-drawing';

const keys = {
  /** Drawing of anonymous user (drawing file) */
  drawing: 'free-drawing-web-drawing',
  /** Last drawing open by logged in user, opened again on next visit */
  lastDrawing: 'free-drawing-web-last-drawing',
  /** Stage saved by the drawer without storage option (demo before this app) */
  stage: 'free-drawing',
};

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable: kept for this visit
  }
};

const emptyDrawing = (): DrawingFile => ({ type: 'free-drawing', version: 1, background: '#fff', shapes: [] });

/**
 * Drawing of a stage saved by the drawer itself: drawing layer and background
 */
function fromStage(json: string): DrawingFile | null {
  type Node = { attrs?: Record<string, unknown>; children?: Node[] };
  const layers: Node[] = JSON.parse(json)?.children ?? [];
  const draw = layers.find((layer) => String(layer.attrs?.name).trim() === 'draw');
  const background = layers.find((layer) => layer.attrs?.name === 'background')?.children?.[0]?.attrs?.fill;

  return draw
    ? {
        type: 'free-drawing',
        version: 1,
        background: typeof background === 'string' ? (background as DrawingFile['background']) : '#fff',
        shapes: (draw.children ?? []) as DrawingFile['shapes'],
      }
    : null;
}

/**
 * Data kept in browser: drawing of anonymous user, last drawing of logged in user
 */
export const local = {
  /** Drawing of anonymous user, else the one of the demo, else an empty one (drawing of an account never kept) */
  loadDrawing(): DrawingFile {
    for (const [key, parse] of [
      [keys.drawing, JSON.parse],
      [keys.stage, fromStage],
    ] as const) {
      const json = read(key);

      try {
        const file = json && parse(json);

        if (file) return file;
      } catch {
        // invalid data: next one
      }
    }
    return emptyDrawing();
  },
  saveDrawing: (file: DrawingFile) => write(keys.drawing, JSON.stringify(file)),
  lastDrawingId: () => read(keys.lastDrawing),
  setLastDrawingId: (id: string) => write(keys.lastDrawing, id),
};
