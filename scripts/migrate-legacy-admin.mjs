import nextEnv from "@next/env";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(path.resolve(process.cwd(), ".."));

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const passwordHash = process.env.ADMIN_PASSWORD_HASH;

if (!email || !passwordHash) {
  throw new Error("No se encontraron las credenciales anteriores para migrar.");
}

const databasePath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "sportcrz.db");
const db = new DatabaseSync(databasePath);

try {
  db.prepare(`
    INSERT INTO users (email, password_hash, role)
    VALUES (?, ?, 'admin')
    ON CONFLICT(email) DO UPDATE SET
      password_hash = excluded.password_hash,
      role = 'admin',
      active = 1,
      updated_at = CURRENT_TIMESTAMP
  `).run(email, passwordHash);

  console.log("Administrador anterior migrado correctamente a SQLite.");
} finally {
  db.close();
}
