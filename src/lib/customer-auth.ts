import "server-only";

import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  findCustomerByEmail,
  getCustomerById,
} from "@/lib/database";

const COOKIE_NAME = "sportcrz_customer_session";
const SESSION_DURATION = 60 * 60 * 24 * 30; /* 30 días */

type CustomerSessionPayload = {
  customerId: number;
  email: string;
  exp: number;
};

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET no está configurado.");
  }

  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url");
}

function encodePayload(payload: CustomerSessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(encoded: string): CustomerSessionPayload | null {
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as CustomerSessionPayload;

    if (!payload.customerId || !payload.email || !payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/* ===== Hash de contraseñas (mismo formato que admin) ===== */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPasswordHash(password: string, stored: string): boolean {
  const [salt, storedHash] = stored.split(":");

  if (!salt || !storedHash) return false;

  try {
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(storedHash, "hex");

    return (
      derived.length === expected.length && timingSafeEqual(derived, expected)
    );
  } catch {
    return false;
  }
}

/* ===== Session ===== */

export async function createCustomerSession(
  customerId: number,
  email: string
) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_DURATION;

  const encoded = encodePayload({ customerId, email, exp: expires });
  const token = `${encoded}.${sign(encoded)}`;

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export async function destroyCustomerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCustomerSession(): Promise<{
  customerId: number;
  email: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  const [encoded, signature] = token.split(".");

  if (!encoded || !signature) return null;

  const expected = sign(encoded);

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);

    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }
  } catch {
    return null;
  }

  const payload = decodePayload(encoded);

  if (!payload) return null;

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  const customer = await getCustomerById(payload.customerId);

  if (!customer) return null;

  return { customerId: payload.customerId, email: customer.email };
}

/* ===== Registro / login ===== */

export async function registerCustomer(data: {
  email: string;
  password: string;
  full_name: string;
  phone: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = data.email.trim().toLowerCase();

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { ok: false, error: "email" };
  }

  if (data.password.length < 6) {
    return { ok: false, error: "password" };
  }

  if (!data.full_name.trim()) {
    return { ok: false, error: "name" };
  }

  const existing = await findCustomerByEmail(email);

  if (existing) {
    return { ok: false, error: "exists" };
  }

  const { createCustomer } = await import("@/lib/database");

  const id = await createCustomer({
    email,
    password_hash: hashPassword(data.password),
    full_name: data.full_name,
    phone: data.phone,
  });

  await createCustomerSession(id, email);

  return { ok: true };
}

export async function loginCustomer(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const customer = await findCustomerByEmail(email);

  if (!customer || !verifyPasswordHash(password, customer.password_hash)) {
    return { ok: false, error: "invalid" };
  }

  await createCustomerSession(customer.id, customer.email);

  return { ok: true };
}

/* Guard para páginas que requieren sesión de cliente. */
export async function requireCustomer() {
  const session = await getCustomerSession();

  if (!session) {
    redirect("/cuenta/login");
  }

  return session;
}
