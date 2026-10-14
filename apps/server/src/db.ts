import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Kysely } from 'kysely';
import { Migrator, type Migration, type MigrationProvider } from 'kysely/migration';
import { NodeSqliteDialect } from '@better-auth/kysely-adapter/node-sqlite-dialect';

/**
 * Tables of the app (tables of users and sessions belong to Better Auth: `user`, `session`, `account`, `verification`)
 */
export type Database = {
  drawing: {
    id: string;
    userId: string;
    name: string;
    /** Drawing file JSON (`DrawingFile` of the library) */
    content: string;
    createdAt: string;
    updatedAt: string;
  };
  preferences: {
    userId: string;
    /** Preferences JSON (`Preferences` of the library) */
    content: string;
    updatedAt: string;
  };
};

/**
 * SQLite database of Node (no native module to build), shared by Better Auth and the app
 */
export function createDatabase(path: string): Kysely<Database> {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });

  // not imported: vite of tests does not know this built-in module
  const { DatabaseSync } = process.getBuiltinModule('node:sqlite');
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
};

const provider: MigrationProvider = { getMigrations: async () => migrations };

/**
 * Create or update app tables (after Better Auth ones: they reference `user`)
 */
export async function migrateApp(db: Kysely<Database>) {
  const { error } = await new Migrator({ db, provider }).migrateToLatest();

  if (error) throw error;
}
