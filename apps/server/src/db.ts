import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Kysely } from 'kysely';
import { Migrator, type Migration, type MigrationProvider } from 'kysely/migration';
import { NodeSqliteDialect } from '@better-auth/kysely-adapter/node-sqlite-dialect';

/**
 * Tables of the app (tables of users and sessions belong to Better Auth: `user`, `session`, `account`, `verification`)
 */
export type Database = {
  /** Accounts (table of Better Auth): columns read by the app only */
  user: {
    id: string;
  };
  drawing: {
    id: string;
    userId: string;
    name: string;
    /** Drawing file JSON (`DrawingFile` of the library) */
    content: string;
    createdAt: string;
    updatedAt: string;
    /** Version of its content, increased by each save of it: a save of an older version is refused */
    version: number;
  };
  preferences: {
    userId: string;
    /** Preferences JSON (`Preferences` of the library) */
    content: string;
    updatedAt: string;
  };
  /** Collaboration rooms: owner, rights and settings, kept while the room is empty (its drawing in `roomDrawing`) */
  room: {
    id: string;
    /** State JSON (`SavedRoom` of `collaboration.ts`) */
    content: string;
    /** Last use (user joining, rights or settings changed), rooms unused for a while are removed */
    updatedAt: string;
  };
  /** Drawing of an empty room, saved when its last user left, given back to the next user joining it (then removed) */
  roomDrawing: {
    /** Id of the room, removed with it */
    room: string;
    /** Drawing JSON (`SavedDrawing` of `collaboration.ts`; encrypted shapes, files and background of an encrypted room) */
    content: string;
    /** Length of its JSON, within `limits.savedSize` for all rooms */
    size: number;
    savedAt: string;
  };
};

/**
 * SQLite module of Node, without its experimental warning (stable for this app since Node 22.13).
 * Not imported: vite of tests does not know this built-in module
 * @returns The `node:sqlite` module
 */
function loadSqlite(): typeof import('node:sqlite') {
  const { emitWarning } = process;

  // warning emitted once, when the module is loaded
  process.emitWarning = ((warning: string | Error, ...args: unknown[]) => {
    if (!String(warning instanceof Error ? warning.message : warning).includes('SQLite is an experimental feature')) {
      Reflect.apply(emitWarning, process, [warning, ...args]);
    }
  }) as typeof process.emitWarning;
  try {
    return process.getBuiltinModule('node:sqlite');
  } finally {
    process.emitWarning = emitWarning;
  }
}

/**
 * SQLite database of Node (no native module to build), shared by Better Auth and the app
 * @param path File of the database, `:memory:` for tests
 * @returns Kysely instance on the database, foreign keys enforced
 */
export function createDatabase(path: string): Kysely<Database> {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });

  const { DatabaseSync } = loadSqlite();
  const database = new DatabaseSync(path);

  // users removed with their drawings and preferences
  database.exec('PRAGMA foreign_keys = ON');

  return new Kysely<Database>({ dialect: new NodeSqliteDialect({ database }) });
}

/**
 * Migrations of app tables, in order: never change one already run, add a new one
 */
const migrations: Record<string, Migration> = {
  '001-drawings-preferences': {
    async up(db) {
      await db.schema
        .createTable('drawing')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('userId', 'text', (col) => col.notNull().references('user.id').onDelete('cascade'))
        .addColumn('name', 'text', (col) => col.notNull())
        .addColumn('content', 'text', (col) => col.notNull())
        .addColumn('createdAt', 'text', (col) => col.notNull())
        .addColumn('updatedAt', 'text', (col) => col.notNull())
        .execute();
      await db.schema.createIndex('drawing_userId').on('drawing').columns(['userId', 'updatedAt']).execute();
      await db.schema
        .createTable('preferences')
        .addColumn('userId', 'text', (col) => col.primaryKey().references('user.id').onDelete('cascade'))
        .addColumn('content', 'text', (col) => col.notNull())
        .addColumn('updatedAt', 'text', (col) => col.notNull())
        .execute();
    },
  },
  '002-rooms': {
    async up(db) {
      await db.schema
        .createTable('room')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('content', 'text', (col) => col.notNull())
        .addColumn('updatedAt', 'text', (col) => col.notNull())
        .execute();
      await db.schema.createIndex('room_updatedAt').on('room').column('updatedAt').execute();
    },
  },
  '003-drawing-version': {
    async up(db) {
      await db.schema
        .alterTable('drawing')
        .addColumn('version', 'integer', (col) => col.notNull().defaultTo(1))
        .execute();
    },
  },
  '004-room-drawings': {
    async up(db) {
      await db.schema
        .createTable('roomDrawing')
        .addColumn('room', 'text', (col) => col.primaryKey().references('room.id').onDelete('cascade'))
        .addColumn('content', 'text', (col) => col.notNull())
        .addColumn('size', 'integer', (col) => col.notNull())
        .addColumn('savedAt', 'text', (col) => col.notNull())
        .execute();
      await db.schema.createIndex('roomDrawing_savedAt').on('roomDrawing').column('savedAt').execute();
    },
  },
};

const provider: MigrationProvider = { getMigrations: async () => migrations };

/**
 * Create or update app tables (after Better Auth ones: they reference `user`)
 */
export async function migrateApp(db: Kysely<Database>) {
  const { error } = await new Migrator({ db, provider }).migrateToLatest();

  if (error) throw error;
}
