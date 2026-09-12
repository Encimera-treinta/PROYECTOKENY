import { NextResponse } from "next/server";
import {
  createOrder,
  generateOrderCode,
  getProductById,
  type NewOrderItem,
} from "@/lib/database";
import {
  createPaymentPage,
  isTiloPayConfigured,
} from "@/lib/tilopay";

type CheckoutItem = {
  id: number | null;
  name: string;
  price: number;
  quantity: number;
};

type CheckoutBody = {
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  notes?: string;
  items?: CheckoutItem[];
};

function badRequest(message: string) {
  return NextResponse.json(
    { error: message },
    { status: 400 }
  );
}

export async function POST(request: Request) {
  if (!isTiloPayConfigured()) {
    return NextResponse.json(
      {
        error:
          "TiloPay no está configurado. Añade TILOPAY_CHECKOUT_KEY, TILOPAY_API_USER y TILOPAY_API_PASSWORD en .env.local",
      },
      { status: 503 }
    );
  }

  let body: CheckoutBody;

  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return badRequest("Cuerpo inválido.");
  }

  const customer = body.customer ?? {};
  const firstName = customer.firstName?.trim() || "";
  const lastName = customer.lastName?.trim() || "";
  const email = customer.email?.trim().toLowerCase() || "";
  const phone = customer.phone?.trim() || "";
  const address = customer.address?.trim() || "";
  const city = customer.city?.trim() || "";
  const state = customer.state?.trim() || "PA";
  const zip = customer.zip?.trim() || "";
  const country = customer.country?.trim() || "PA";

  if (!firstName || !lastName) {
    return badRequest("Nombre y apellidos son obligatorios.");
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return badRequest("Correo inválido.");
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return badRequest("El carrito está vacío.");
  }

  /* Valida cada item contra la base de datos para
     evitar precios manipulados desde el cliente. */
  const validatedItems: NewOrderItem[] = [];
  let subtotal = 0;

  for (const item of body.items) {
    if (
      !item.id ||
      !Number.isInteger(item.id) ||
      !Number.isFinite(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    ) {
      return badRequest("Artículo inválido.");
    }

    const product = await getProductById(item.id);

    if (!product || product.active !== 1) {
      return badRequest(
        `El producto "${item.name}" ya no está disponible.`
      );
    }

    const quantity = Math.trunc(item.quantity);

    if (product.stock !== null && quantity > product.stock) {
      return badRequest(
        `Stock insuficiente de "${product.name}" (disponible: ${product.stock}).`
      );
    }

    validatedItems.push({
      product_id: product.id,
      product_name: product.name,
      unit_price: product.price,
      quantity,
    });

    subtotal += product.price * quantity;
  }

  subtotal = Math.round(subtotal * 100) / 100;

  if (subtotal <= 0) {
    return badRequest("El total debe ser mayor que cero.");
  }

  const orderCode = generateOrderCode();

  const orderId = await createOrder({
    order_code: orderCode,
    customer_name: `${firstName} ${lastName}`.trim(),
    customer_email: email,
    customer_phone: phone || null,
    delivery_address: address || null,
    subtotal,
    total: subtotal,
    notes: body.notes?.trim() || null,
    items: validatedItems,
  });

  const origin = new URL(request.url).origin;

  let paymentUrl: string;

  try {
    paymentUrl = await createPaymentPage({
      amount: subtotal.toFixed(2),
      orderNumber: orderCode,
      redirectUrl: `${origin}/checkout/resultado`,
      customer: {
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        state,
        zip,
        country,
      },
    });
  } catch (error) {
    console.error("[tilopay] processPayment falló:", error);
    return NextResponse.json(
      {
        error:
          "No fue posible iniciar el pago con TiloPay. Intenta de nuevo.",
        orderCode,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    orderId,
    orderCode,
    paymentUrl,
  });
}
