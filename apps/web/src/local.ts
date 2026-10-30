import type { DrawingFile } from '@fabwcie/free-drawing';
import { ApiError, type DrawingSummary, type DrawingsStore } from './api';

const keys = {
  /** Drawings of browser: summaries (content of each one in `content` + id) */
  drawings: 'free-drawing-web-drawings',
  content: 'free-drawing-web-drawing-',
  /** Last drawing of browser open, opened again on next visit */
  lastLocalDrawing: 'free-drawing-web-last-local-drawing',
  /** Last drawing open by logged in user, opened again on next visit */
  lastDrawing: 'free-drawing-web-last-drawing',
  /** Drawing of browser of each collaboration room (room id: drawing id), opened again by its link */
  localRoomDrawings: 'free-drawing-web-local-room-drawings',
  /** Drawing of logged in user of each collaboration room, opened again by its link */
  roomDrawings: 'free-drawing-web-room-drawings',
  /** Drawing of anonymous user before drawings of browser (drawing file) */
  drawing: 'free-drawing-web-drawing',
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
 * Data kept in browser: last drawings open (of browser, of logged in user), drawing of previous versions
 */
export const local = {
  /** Drawing of anonymous user before drawings of browser, else the one of the demo, else an empty one */
  previousDrawing(): DrawingFile {
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
  /** No drawing of browser created yet (first visit since drawings of browser) */
  isFirstVisit: () => read(keys.drawings) === null,
  /** Key of the list of drawings of browser, changed by the saves of other tabs (`storage` event) */
  isDrawingsKey: (key: string | null) => key === keys.drawings,
  lastLocalDrawingId: () => read(keys.lastLocalDrawing),
  setLastLocalDrawingId: (id: string) => write(keys.lastLocalDrawing, id),
  lastDrawingId: () => read(keys.lastDrawing),
  setLastDrawingId: (id: string) => write(keys.lastDrawing, id),
  /** Drawing of a collaboration room (of logged in user, else of browser), null if none */
  roomDrawingId: (room: string, account: boolean): string | null => roomDrawings(account)[room] ?? null,
  /** Drawing of a collaboration room, opened again by its link (last rooms only) */
  setRoomDrawingId(room: string, id: string, account: boolean) {
    const rooms = roomDrawings(account);

    if (rooms[room] === id) return;
    delete rooms[room];
    rooms[room] = id;
    write(
      account ? keys.roomDrawings : keys.localRoomDrawings,
      JSON.stringify(Object.fromEntries(Object.entries(rooms).slice(-20)))
    );
  },
};

/** Drawings of collaboration rooms (room id: drawing id), oldest first */
function roomDrawings(account: boolean): Record<string, string> {
  try {
    const rooms = JSON.parse(read(account ? keys.roomDrawings : keys.localRoomDrawings) ?? '{}');

    return rooms && typeof rooms === 'object' && !Array.isArray(rooms) ? rooms : {};
  } catch {
    return {};
  }
}

/** Drawings of browser, last updated first (first version for the ones of previous versions) */
const summaries = (): DrawingSummary[] => {
  try {
    const list = JSON.parse(read(keys.drawings) ?? '[]');

    return Array.isArray(list) ? list.map((summary) => ({ version: 1, ...summary })) : [];
  } catch {
    return [];
  }
};

/** Errors when storage is full or unavailable: drawing not saved */
const saveSummaries = (list: DrawingSummary[]) =>
  localStorage.setItem(keys.drawings, JSON.stringify(list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))));

const find = (id: string) => {
  const drawing = summaries().find((summary) => summary.id === id);

  // as the server: explained by the texts of the app, its changes kept in a new drawing by a save
  if (!drawing) throw new ApiError('drawing not found', 404);
  return drawing;
};

/** Trimmed, 100 characters at most (as on server) */
const drawingName = (name = '') => name.trim().slice(0, 100);

const newId = () => crypto.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

/**
 * Drawings kept in browser (anonymous user, static site), same functions as drawings of an account on server
 */
export const localDrawings: DrawingsStore = {
  listDrawings: async () => summaries(),
  async createDrawing({ name, content = emptyDrawing() }) {
    const now = new Date().toISOString();
    const drawing = { id: newId(), name: drawingName(name), createdAt: now, updatedAt: now, version: 1 };

    localStorage.setItem(keys.content + drawing.id, JSON.stringify(content));
    saveSummaries([drawing, ...summaries()]);
    return drawing;
  },
  async getDrawing(id) {
    const drawing = find(id);
    const json = read(keys.content + id);
    let content = emptyDrawing();

    try {
      if (json) content = JSON.parse(json);
    } catch {
      // invalid data: empty drawing
    }
    return { ...drawing, content };
  },
  async updateDrawing(id, { name, content, version }) {
    const saved = find(id);

    // content of another version, saved since by another tab: refused, as by the server
    if (content && version !== undefined && version !== saved.version) {
      throw new ApiError('drawing changed elsewhere', 409, 'DRAWING_CHANGED');
    }

    const drawing = {
      ...saved,
      ...(name !== undefined && { name: drawingName(name) }),
      ...(content && { version: (saved.version ?? 1) + 1 }),
      updatedAt: new Date().toISOString(),
    };

    if (content) localStorage.setItem(keys.content + id, JSON.stringify(content));
    saveSummaries([drawing, ...summaries().filter((summary) => summary.id !== id)]);
    return drawing;
  },
  async deleteDrawing(id) {
    localStorage.removeItem(keys.content + id);
    saveSummaries(summaries().filter((summary) => summary.id !== id));
    return null;
  },
};
