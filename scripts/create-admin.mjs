import { randomBytes, scryptSync } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const cliEmail = process.argv[2]?.trim().toLowerCase();
const rl = createInterface({ input: stdin, output: stdout });

try {
  const email = cliEmail || (await rl.question("Correo del administrador: ")).trim().toLowerCase();
  const password = await rl.question("Contraseña (mínimo 10 caracteres): ");

  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("El correo no es válido.");
  if (password.length < 10) throw new Error("La contraseña debe tener al menos 10 caracteres.");

  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  const databasePath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "sportcrz.db");

  mkdirSync(path.dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec(`
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
  `);
  db.prepare(`
    INSERT INTO users (email, password_hash, role)
    VALUES (?, ?, 'admin')
    ON CONFLICT(email) DO UPDATE SET
      password_hash = excluded.password_hash,
      role = 'admin',
      active = 1,
      updated_at = CURRENT_TIMESTAMP
  `).run(email, `${salt}:${hash}`);
  db.close();

  stdout.write(`Administrador ${email} creado correctamente.\n`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  rl.close();
}
