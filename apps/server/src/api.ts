import { randomUUID } from 'node:crypto';
import express, { type ErrorRequestHandler, type Request, type RequestHandler, type Response } from 'express';
import { type Kysely, sql } from 'kysely';
import { type Auth, type User, getUser } from './auth';
import type { Database } from './db';

/** Size of a drawing at most (JSON, image files included) */
export const maxDrawingSize = '20mb';

/** Drawings of an account at most: count, and size of their JSON (disk of the server), tests lower them */
export const drawingsLimits = { count: 500, size: 100_000_000 };

/** Refusal of a drawing beyond the limits of the account (`drawingsLimits`) */
const tooMany = { error: 'too many drawings', code: 'TOO_MANY_DRAWINGS' };
const tooBig = { error: 'drawings of the account too big', code: 'DRAWINGS_TOO_BIG' };

const themes = ['light', 'dark', 'system'];

/** Styles of the grid (`GridStyle` of the library) */
const gridStyles = ['squares', 'dots', 'lines', 'isometric'];

/** Actions of the mouse wheel (`WheelAction` of the library) */
const wheelActions = ['zoom', 'pan'];

type Handler = (req: Request, res: Response, user: User) => Promise<unknown>;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** JSON body as object, empty if it is not one */
const getBody = (req: Request): Record<string, unknown> => (isObject(req.body) ? req.body : {});

/**
 * Drawing file of the library (`DrawingFile`): checked shape only, clients validate shapes when they load it
 */
function isDrawingFile(value: unknown) {
  return (
    isObject(value) &&
    value.type === 'free-drawing' &&
    typeof value.background === 'string' &&
    Array.isArray(value.shapes)
  );
}

/**
 * Known preferences of the library (`Preferences`) only, invalid values ignored
 */
function toPreferences(value: Record<string, unknown>) {
  const { theme, language, grid, snapping, zen, autoSave, keepTool, shapeRecognition, gridStyle, wheelAction } = value;

  return {
    ...(typeof theme === 'string' && themes.includes(theme) && { theme }),
    ...(typeof language === 'string' && /^[a-z]{2}$|^auto$/.test(language) && { language }),
    ...(typeof grid === 'boolean' && { grid }),
    ...(typeof snapping === 'boolean' && { snapping }),
    ...(typeof zen === 'boolean' && { zen }),
    ...(typeof autoSave === 'boolean' && { autoSave }),
    ...(typeof keepTool === 'boolean' && { keepTool }),
    ...(typeof shapeRecognition === 'boolean' && { shapeRecognition }),
    ...(typeof gridStyle === 'string' && gridStyles.includes(gridStyle) && { gridStyle }),
    ...(typeof wheelAction === 'string' && wheelActions.includes(wheelAction) && { wheelAction }),
  };
}

/** Name of a drawing: trimmed, 100 characters at most */
const toName = (name: unknown) => (typeof name === 'string' ? name.trim().slice(0, 100) : '');

/**
 * API of logged in users (session cookie): `/me`, `/preferences`, `/drawings` (their own only, `drawingsLimits`)
 */
export function createApi(auth: Auth, db: Kysely<Database>) {
  const router = express.Router();

  // logged in user, errors to error handler (express 4 does not catch async errors)
  const withUser =
    (handler: Handler): RequestHandler =>
    async (req, res, next) => {
      try {
        const user = await getUser(auth, req.headers);

        if (!user) return res.status(401).json({ error: 'not logged in' });
        await handler(req, res, user);
      } catch (error) {
        next(error);
      }
    };
  const findDrawing = (id: string, user: User) =>
    db.selectFrom('drawing').selectAll().where('id', '=', id).where('userId', '=', user.id).executeTakeFirst();
  const summary = ({ id, name, createdAt, updatedAt }: Database['drawing']) => ({ id, name, createdAt, updatedAt });
  // drawings of the user: count, size of their JSON
  const usage = async (user: User) => {
    const row = await db
      .selectFrom('drawing')
      .select([sql<number>`count(*)`.as('count'), sql<number>`coalesce(sum(length(content)), 0)`.as('size')])
      .where('userId', '=', user.id)
      .executeTakeFirstOrThrow();

    return { count: Number(row.count), size: Number(row.size) };
  };

  router.use(express.json({ limit: maxDrawingSize }));

  router.get(
    '/me',
    withUser(async (_req, res, user) => res.json(user))
  );

  router.get(
    '/preferences',
    withUser(async (_req, res, user) => {
      const row = await db.selectFrom('preferences').select('content').where('userId', '=', user.id).executeTakeFirst();

      res.json(row ? JSON.parse(row.content) : {});
    })
  );

  router.put(
    '/preferences',
    withUser(async (req, res, user) => {
      if (!isObject(req.body)) return res.status(400).json({ error: 'preferences object expected' });

      const preferences = toPreferences(req.body);
      const values = { content: JSON.stringify(preferences), updatedAt: new Date().toISOString() };

      await db
        .insertInto('preferences')
        .values({ userId: user.id, ...values })
        .onConflict((conflict) => conflict.column('userId').doUpdateSet(values))
        .execute();
      res.json(preferences);
    })
  );

  router.get(
    '/drawings',
    withUser(async (_req, res, user) => {
      const rows = await db
        .selectFrom('drawing')
        .select(['id', 'name', 'createdAt', 'updatedAt'])
        .where('userId', '=', user.id)
        .orderBy('updatedAt', 'desc')
        .execute();

      res.json(rows);
    })
  );

  router.post(
    '/drawings',
    withUser(async (req, res, user) => {
      const { name, content } = getBody(req);

      if (content !== undefined && !isDrawingFile(content))
        return res.status(400).json({ error: 'not a drawing file' });

      const now = new Date().toISOString();
      const drawing = {
        id: randomUUID(),
        userId: user.id,
        name: toName(name),
        content: JSON.stringify(content ?? { type: 'free-drawing', version: 1, background: '#fff', shapes: [] }),
        createdAt: now,
        updatedAt: now,
      };
      const { count, size } = await usage(user);

      if (count >= drawingsLimits.count) return res.status(403).json(tooMany);
      if (size + drawing.content.length > drawingsLimits.size) return res.status(403).json(tooBig);

      await db.insertInto('drawing').values(drawing).execute();
      res.status(201).json(summary(drawing));
    })
  );

  router.get(
    '/drawings/:id',
    withUser(async (req, res, user) => {
      const drawing = await findDrawing(req.params.id, user);

      if (!drawing) return res.status(404).json({ error: 'drawing not found' });
      res.json({ ...summary(drawing), content: JSON.parse(drawing.content) });
    })
  );

  router.put(
    '/drawings/:id',
    withUser(async (req, res, user) => {
      const { name, content } = getBody(req);

      if (content !== undefined && !isDrawingFile(content))
        return res.status(400).json({ error: 'not a drawing file' });

      const drawing = await findDrawing(req.params.id, user);

      if (!drawing) return res.status(404).json({ error: 'drawing not found' });

      const changes = {
        ...(name !== undefined && { name: toName(name) }),
        ...(content !== undefined && { content: JSON.stringify(content) }),
        updatedAt: new Date().toISOString(),
      };

      // bigger drawing: within the size of the account (smaller ones always saved)
      if (changes.content && changes.content.length > drawing.content.length) {
        const { size } = await usage(user);

        if (size - drawing.content.length + changes.content.length > drawingsLimits.size) {
          return res.status(403).json(tooBig);
        }
      }

      await db.updateTable('drawing').set(changes).where('id', '=', drawing.id).execute();
      res.json(summary({ ...drawing, ...changes }));
    })
  );

  router.delete(
    '/drawings/:id',
    withUser(async (req, res, user) => {
      const { numDeletedRows } = await db
        .deleteFrom('drawing')
        .where('id', '=', req.params.id)
        .where('userId', '=', user.id)
        .executeTakeFirst();

      res.status(numDeletedRows ? 204 : 404).end();
    })
  );

  router.use((_req, res) => res.status(404).json({ error: 'not found' }));

  // body too large, invalid JSON: client errors, others logged
  const onError: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) return next(error);

    const status = typeof error?.status === 'number' && error.status < 500 ? error.status : 500;

    if (status === 500) console.error(error);
    res.status(status).json({ error: status === 500 ? 'server error' : error.message });
  };

  router.use(onError);

  return router;
}
