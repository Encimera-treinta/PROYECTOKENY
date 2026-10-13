import { NextResponse } from "next/server";
import { createAdminSession } from "@/lib/admin-auth";
import { consumeAdminLoginToken } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------
   Limite de intentos por IP.

   El token tiene 256 bits de entropia, asi que adivinarlo es
   imposible en la practica. Esto evita que alguien pueda probar
   tokens robados en cadena sin limite.
   ------------------------------------------------------------ */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 20;

type Bucket = { count: number; resetAt: number };

const globalBuckets = globalThis as typeof globalThis & {
  magicLinkBuckets?: Map<string, Bucket>;
};

const buckets =
  globalBuckets.magicLinkBuckets ||
  (globalBuckets.magicLinkBuckets = new Map<
    string,
    Bucket
  >());

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  const bucket = buckets.get(ip);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  bucket.count += 1;

  return bucket.count > MAX_ATTEMPTS;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return "local";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const origin = new URL(request.url).origin;
  const { token } = await params;

  const invalid = () => {
    const response = NextResponse.redirect(
      new URL("/entrar/invalido", origin)
    );

    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("Cache-Control", "no-store");

    return response;
  };

  if (isRateLimited(clientIp(request))) {
    return invalid();
  }

  const user = await consumeAdminLoginToken(token);

  if (!user) return invalid();

  /* Crea la sesion normal de admin. A partir de aqui la persona
     navega con su cookie, no con el link. */
  await createAdminSession(user.email);

  const response = NextResponse.redirect(
    new URL("/hola", origin)
  );

  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");

  return response;
}