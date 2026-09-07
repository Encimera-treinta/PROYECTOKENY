import {
  createHmac,
  scryptSync,
  timingSafeEqual,
} from "crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findActiveAdminByEmail } from "@/lib/database";

const COOKIE_NAME = "sportcrz_admin_session";

const SESSION_DURATION =
  60 * 60 * 24 * 7;

type SessionPayload = {
  email: string;
  exp: number;
};

function getSessionSecret() {
  const secret =
    process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET no está configurado."
    );
  }

  return secret;
}

function sign(value: string) {
  return createHmac(
    "sha256",
    getSessionSecret()
  )
    .update(value)
    .digest("base64url");
}

function encodePayload(
  payload: SessionPayload
) {
  return Buffer.from(
    JSON.stringify(payload)
  ).toString("base64url");
}

function decodePayload(
  encoded: string
): SessionPayload | null {
  try {
    const json = Buffer.from(
      encoded,
      "base64url"
    ).toString("utf8");

    const payload =
      JSON.parse(json) as SessionPayload;

    if (
      !payload.email ||
      !payload.exp
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function verifyPasswordHash(password: string, stored: string) {
  const parts = stored.split(":");

  if (parts.length !== 2) {
    return false;
  }

  const [salt, storedHash] =
    parts;

  try {
    const derivedHash =
      scryptSync(
        password,
        salt,
        64
      );

    const storedBuffer =
      Buffer.from(
        storedHash,
        "hex"
      );

    if (
      storedBuffer.length !==
      derivedHash.length
    ) {
      return false;
    }

    return timingSafeEqual(
      storedBuffer,
      derivedHash
    );
  } catch {
    return false;
  }
}

export function authenticateAdmin(email: string, password: string) {
  const user = findActiveAdminByEmail(email);

  if (!user || !verifyPasswordHash(password, user.password_hash)) {
    return null;
  }

  return user;
}

export async function createAdminSession(
  email: string
) {
  const expires =
    Math.floor(
      Date.now() / 1000
    ) + SESSION_DURATION;

  const payload: SessionPayload = {
    email,
    exp: expires,
  };

  const encoded =
    encodePayload(payload);

  const signature =
    sign(encoded);

  const token =
    `${encoded}.${signature}`;

  const cookieStore =
    await cookies();

  cookieStore.set(
    COOKIE_NAME,
    token,
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      maxAge:
        SESSION_DURATION,
    }
  );
}

export async function destroyAdminSession() {
  const cookieStore =
    await cookies();

  cookieStore.delete(
    COOKIE_NAME
  );
}

export async function getAdminSession() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      COOKIE_NAME
    )?.value;

  if (!token) {
    return null;
  }

  const parts =
    token.split(".");

  if (parts.length !== 2) {
    return null;
  }

  const [encoded, signature] =
    parts;

  const expectedSignature =
    sign(encoded);

  try {
    const signatureBuffer =
      Buffer.from(signature);

    const expectedBuffer =
      Buffer.from(
        expectedSignature
      );

    if (
      signatureBuffer.length !==
      expectedBuffer.length
    ) {
      return null;
    }

    if (
      !timingSafeEqual(
        signatureBuffer,
        expectedBuffer
      )
    ) {
      return null;
    }
  } catch {
    return null;
  }

  const payload =
    decodePayload(encoded);

  if (!payload) {
    return null;
  }

  const now =
    Math.floor(
      Date.now() / 1000
    );

  if (payload.exp <= now) {
    return null;
  }

  if (!findActiveAdminByEmail(payload.email)) {
    return null;
  }

  return payload;
}

export async function requireAdmin() {
  const session =
    await getAdminSession();

  if (!session) {
    redirect(
      "/admin/login"
    );
  }

  return session;
}
