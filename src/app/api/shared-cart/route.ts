import { NextResponse } from "next/server";
import {
  createSharedCart,
  getSharedCartByCode,
  updateSharedCartStatus,
  type SharedCart,
} from "@/lib/database";
import { allowSharedCart } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Limite defensivo: nadie necesita 100 lineas en un pedido. */
const MAX_ITEMS = 50;

function sanitizeText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";

  return value.trim().slice(0, max);
}

function sanitizeNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(n) || n < 0) return 0;

  return Math.round(n * 100) / 100;
}

function sanitizeProductId(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(n) || n <= 0) return null;

  return n;
}

export async function POST(request: Request) {
  /* Sin sesion (se puede compartir sin entrar), pero con
     freno: 20 pedidos compartidos por IP cada 10 minutos. */
  if (!(await allowSharedCart())) {
    return NextResponse.json(
      {
        error:
          "Demasiados pedidos seguidos. Espera unos minutos.",
      },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Datos invalidos." },
      { status: 400 }
    );
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];

  if (rawItems.length === 0) {
    return NextResponse.json(
      { error: "El carrito esta vacio." },
      { status: 400 }
    );
  }

  if (rawItems.length > MAX_ITEMS) {
    return NextResponse.json(
      { error: "Demasiados articulos en el pedido." },
      { status: 400 }
    );
  }

  const items = rawItems
    .slice(0, MAX_ITEMS)
    .map((raw) => {
      const item = (raw ?? {}) as Record<string, unknown>;

      const name = sanitizeText(item.name, 120);

      if (!name) return null;

      const quantity = Math.min(
        Math.max(1, Math.floor(Number(item.quantity) || 1)),
        99
      );

      return {
        product_id: sanitizeProductId(item.id),
        product_name: name,
        image: sanitizeText(item.image, 500) || null,
        unit_price: sanitizeNumber(item.price),
        quantity,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (items.length === 0) {
    return NextResponse.json(
      { error: "El carrito esta vacio." },
      { status: 400 }
    );
  }

  try {
    const cart = await createSharedCart({
      sender_name: sanitizeText(body.sender_name, 80) || null,
      sender_phone: sanitizeText(body.sender_phone, 40) || null,
      recipient_name: sanitizeText(body.recipient_name, 80) || null,
      note: sanitizeText(body.note, 500) || null,
      items,
    });

    return NextResponse.json({ ok: true, code: cart.code });
  } catch {
    return NextResponse.json(
      { error: "No se pudo crear el pedido." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Datos invalidos." },
      { status: 400 }
    );
  }

  const code = sanitizeText(body.code, 32).toUpperCase();

  if (!code) {
    return NextResponse.json(
      { error: "Falta el codigo del pedido." },
      { status: 400 }
    );
  }

  const status = sanitizeText(body.status, 20) as SharedCart["status"];

  if (
    !["pending", "confirmed", "declined", "ordered"].includes(status)
  ) {
    return NextResponse.json(
      { error: "Estado no valido." },
      { status: 400 }
    );
  }

  const existing = await getSharedCartByCode(code);

  if (!existing) {
    return NextResponse.json(
      { error: "Pedido no encontrado." },
      { status: 404 }
    );
  }

  const updated = await updateSharedCartStatus(code, status);

  return NextResponse.json({ ok: true, status: updated?.status ?? status });
}