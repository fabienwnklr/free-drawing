import { randomUUID } from 'node:crypto';
import express, { type ErrorRequestHandler, type Request, type RequestHandler, type Response } from 'express';
import { type Kysely, type Transaction, sql } from 'kysely';
import { type Auth, type User, getRequestUser } from './auth';
import type { Database } from './db';

/** Size of a drawing at most (JSON, image files included) */
export const maxDrawingSize = '20mb';

/** Size of other bodies at most (preferences) */
const maxBodySize = '16kb';

/** Drawings of an account at most: count, and size of their JSON (disk of the server), tests lower them */
export const drawingsLimits = { count: 500, size: 100_000_000 };

/** Refusal of a drawing beyond the limits of the account (`drawingsLimits`) */
const tooMany = { error: 'too many drawings', code: 'TOO_MANY_DRAWINGS' };
const tooBig = { error: 'drawings of the account too big', code: 'DRAWINGS_TOO_BIG' };

/**
 * Header of the account an app makes its requests for: a session of another account (signed in from another tab) is
 * refused, nothing is read nor written in it
 */
export const userHeader = 'x-free-drawing-user';

/** Refusal of a request made for another account than the one of the session */
const otherAccount = { error: 'signed in with another account', code: 'OTHER_ACCOUNT' };

/** Refusal of a content saved over another version (changed since in another tab or on another device) */
const changed = { error: 'drawing changed elsewhere', code: 'DRAWING_CHANGED' };

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
 * Errors of requests as JSON: client errors (body too large, invalid JSON) with their message, others logged
 */
export const onError: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) return next(error);

  const status = typeof error?.status === 'number' && error.status < 500 ? error.status : 500;

  if (status === 500) console.error(error);
  res.status(status).json({ error: status === 500 ? 'server error' : error.message });
};

/**
 * API of logged in users (session cookie): `/me`, `/preferences`, `/drawings` (their own only, `drawingsLimits`;
 * `version` of their content: a content sent with an older version is refused). The session is checked before a body
 * is read: anonymous requests never hold the memory of the server
 */
export function createApi(auth: Auth, db: Kysely<Database>) {
  const router = express.Router();
  // bodies read by the routes taking one, within their size
  const drawingBody = express.json({ limit: maxDrawingSize });
  const smallBody = express.json({ limit: maxBodySize });

  // logged in user of the request (`res.locals.user`), before its body; session extended: its cookie sent again
  router.use(async (req, res, next) => {
    try {
      const { user, cookies } = await getRequestUser(auth, req.headers);

      for (const cookie of cookies) res.append('Set-Cookie', cookie);
      if (!user) return res.status(401).json({ error: 'not logged in' });

      const expected = req.headers[userHeader];

      // made for another account (signed in since from another tab of the app): as a session ended
      if (typeof expected === 'string' && expected && expected !== user.id) return res.status(401).json(otherAccount);
      res.locals.user = user;
      next();
    } catch (error) {
      next(error);
    }
  });

  // logged in user, errors to error handler (express 4 does not catch async errors)
  const withUser =
    (handler: Handler): RequestHandler =>
    async (req, res, next) => {
      try {
        await handler(req, res, res.locals.user as User);
      } catch (error) {
        next(error);
      }
    };
  const findDrawing = (id: string, user: User, executor: Kysely<Database> = db) =>
    executor.selectFrom('drawing').selectAll().where('id', '=', id).where('userId', '=', user.id).executeTakeFirst();
  const summary = ({ id, name, createdAt, updatedAt, version }: Database['drawing']) => ({
    id,
    name,
    createdAt,
    updatedAt,
    version,
  });
  // drawings of the user: count, size of their JSON, read in the transaction writing a drawing (requests of the user at
  // the same time wait for it: they can't all pass the limits)
  const usage = async (trx: Transaction<Database>, user: User) => {
    const row = await trx
      .selectFrom('drawing')
      .select([sql<number>`count(*)`.as('count'), sql<number>`coalesce(sum(length(content)), 0)`.as('size')])
      .where('userId', '=', user.id)
      .executeTakeFirstOrThrow();

    return { count: Number(row.count), size: Number(row.size) };
  };

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
    smallBody,
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
        .select(['id', 'name', 'createdAt', 'updatedAt', 'version'])
        .where('userId', '=', user.id)
        .orderBy('updatedAt', 'desc')
        .execute();

      res.json(rows);
    })
  );

  router.post(
    '/drawings',
    drawingBody,
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
        version: 1,
      };
      const refusal = await db.transaction().execute(async (trx) => {
        const { count, size } = await usage(trx, user);

        if (count >= drawingsLimits.count) return tooMany;
        if (size + drawing.content.length > drawingsLimits.size) return tooBig;

        await trx.insertInto('drawing').values(drawing).execute();
      });

      if (refusal) return res.status(403).json(refusal);
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
    drawingBody,
    withUser(async (req, res, user) => {
      const { name, content, version } = getBody(req);

      if (content !== undefined && !isDrawingFile(content))
        return res.status(400).json({ error: 'not a drawing file' });

      const changes = {
        ...(name !== undefined && { name: toName(name) }),
        ...(content !== undefined && { content: JSON.stringify(content) }),
        updatedAt: new Date().toISOString(),
      };
      const result = await db.transaction().execute(async (trx) => {
        const drawing = await findDrawing(req.params.id, user, trx);

        if (!drawing) return { status: 404, body: { error: 'drawing not found' } };
        // content of the version the client loaded or saved last (none: saved over any version, clients of previous
        // versions): refused when it changed since, the client keeps its changes apart (a copy)
        if (changes.content && typeof version === 'number' && version !== drawing.version) {
          return { status: 409, body: { ...changed, version: drawing.version } };
        }
        // bigger drawing: within the size of the account (smaller ones always saved)
        if (changes.content && changes.content.length > drawing.content.length) {
          const { size } = await usage(trx, user);

          if (size - drawing.content.length + changes.content.length > drawingsLimits.size) {
            return { status: 403, body: tooBig };
          }
        }

        // new version of its content (a name alone keeps it)
        const saved = { ...changes, ...(changes.content && { version: drawing.version + 1 }) };

        await trx.updateTable('drawing').set(saved).where('id', '=', drawing.id).execute();
        return { status: 200, body: summary({ ...drawing, ...saved }) };
      });

      res.status(result.status).json(result.body);
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
  router.use(onError);

  return router;
}
