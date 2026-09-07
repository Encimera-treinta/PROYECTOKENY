import "server-only";

import { mkdirSync } from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";

const databasePath =
  process.env.DATABASE_PATH ||
  path.join(process.cwd(), "data", "sportcrz.db");

mkdirSync(path.dirname(databasePath), { recursive: true });

const globalDatabase = globalThis as typeof globalThis & {
  sportcrzDatabase?: DatabaseSync;
};

export const database =
  globalDatabase.sportcrzDatabase || new DatabaseSync(databasePath);

if (process.env.NODE_ENV !== "production") {
  globalDatabase.sportcrzDatabase = database;
}

database.exec(`
  PRAGMA busy_timeout = 5000;
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'customer')),
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
`);

// Migra una sola vez las credenciales de la versión anterior basada en .env.
// El inicio de sesión siempre consulta SQLite después de esta inserción.
const legacyAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const legacyAdminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

if (legacyAdminEmail && legacyAdminPasswordHash) {
  database
    .prepare(`
      INSERT OR IGNORE INTO users (email, password_hash, role)
      VALUES (?, ?, 'admin')
    `)
    .run(legacyAdminEmail, legacyAdminPasswordHash);
}

export type DatabaseUser = {
  id: number;
  email: string;
  password_hash: string;
  role: "admin" | "customer";
  active: number;
};

export function findActiveAdminByEmail(email: string) {
  return database
    .prepare(`
      SELECT id, email, password_hash, role, active
      FROM users
      WHERE email = ? AND role = 'admin' AND active = 1
      LIMIT 1
    `)
    .get(email.trim().toLowerCase()) as DatabaseUser | undefined;
}

export function getDatabaseStatus() {
  const result = database
    .prepare("SELECT COUNT(*) AS users FROM users")
    .get() as { users: number };

  return {
    connected: true,
    engine: "SQLite",
    users: result.users,
  };
}
