import "server-only";

import { headers } from "next/headers";

/* ==========================================
   RATE LIMIT EN MEMORIA

   Suficiente para una instancia de Next.js.
   En un deploy con varias instancias habria que
   mover esto a Turso/Redis: si no, cada instancia
   lleva su propio contador.
   ========================================== */

type Bucket = {
  count: number;
  resetAt: number;
};

const globalStore = globalThis as typeof globalThis & {
  sportcrzRateLimits?: Map<string, Bucket>;
};

const store =
  globalStore.sportcrzRateLimits ||
  (globalStore.sportcrzRateLimits = new Map<
    string,
    Bucket
  >());

/* Limpia las entradas vencidas para que el Map
   no crezca sin limite. */
function sweep(now: number) {
  if (store.size < 500) return;

  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) {
      store.delete(key);
    }
  }
}

/**
 * Consume un intento. Devuelve true si esta permitido
 * y false si ya se paso del limite.
 */
export function rateLimit(options: {
  /** Agrupa por accion: "admin-login", "checkout"... */
  bucket: string;
  /** Intentos permitidos en la ventana. */
  limit: number;
  /** Ventana en milisegundos. */
  windowMs: number;
  /** Clave extra (por ejemplo el correo). */
  subject?: string;
}): boolean {
  const key = [
    options.bucket,
    options.subject ?? "",
  ].join(":");

  const now = Date.now();

  sweep(now);

  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return true;
  }

  current.count += 1;

  return current.count <= options.limit;
}

export async function clientIp(): Promise<string> {
  const headerList = await headers();

  const forwarded =
    headerList.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return (
    headerList.get("x-real-ip")?.trim() ||
    "local"
  );
}

/* ===== Atajos para los casos de este repo ===== */

export async function allowAdminLogin(
  email: string
) {
  const ip = await clientIp();

  return rateLimit({
    bucket: "admin-login",
    limit: 8,
    windowMs: 10 * 60 * 1000,
    subject: `${ip}:${email.toLowerCase()}`,
  });
}

/* La clave con la que se guardan los intentos fallidos. */
function loginKey(
  bucket: string,
  email: string,
  ip: string
) {
  return `${bucket}:${ip}:${email.toLowerCase()}`;
}

/** Registra un fallo. Devuelve false si ya se paso del limite. */
export async function registerLoginFailure(
  bucket: "admin-login" | "customer-login",
  email: string
) {
  const ip = await clientIp();

  return rateLimit({
    bucket,
    limit: bucket === "admin-login" ? 8 : 10,
    windowMs: 10 * 60 * 1000,
    subject: `${ip}:${email.toLowerCase()}`,
  });
}

/** Consulta el limite sin consumir intento (para no contar el acierto). */
export async function isLoginBlocked(
  bucket: "admin-login" | "customer-login",
  email: string
) {
  const ip = await clientIp();

  const key = loginKey(bucket, email, ip);

  const bucketData = store.get(key);
  const now = Date.now();

  if (!bucketData || bucketData.resetAt <= now) {
    return false;
  }

  const limit = bucket === "admin-login" ? 8 : 10;

  return bucketData.count >= limit;
}

/** Un login correcto borra el historial de fallos. */
export function clearLoginFailures(
  bucket: "admin-login" | "customer-login",
  email: string,
  ip: string
) {
  store.delete(loginKey(bucket, email, ip));
}

export async function allowCustomerLogin(
  email: string
) {
  const ip = await clientIp();

  return rateLimit({
    bucket: "customer-login",
    limit: 8,
    windowMs: 10 * 60 * 1000,
    subject: `${ip}:${email.toLowerCase()}`,
  });
}

export async function allowSharedCart() {
  const ip = await clientIp();

  return rateLimit({
    bucket: "shared-cart",
    limit: 20,
    windowMs: 10 * 60 * 1000,
    subject: ip,
  });
}

export async function allowCheckout() {
  const ip = await clientIp();

  return rateLimit({
    bucket: "checkout",
    limit: 15,
    windowMs: 10 * 60 * 1000,
    subject: ip,
  });
}