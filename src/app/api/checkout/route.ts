import { NextResponse } from "next/server";
import {
  createOrder,
  generateOrderCode,
  getCustomerById,
  getProductById,
  type NewOrderItem,
} from "@/lib/database";
import { getCustomerSession } from "@/lib/customer-auth";
import { allowCheckout } from "@/lib/rate-limit";
import {
  createPaymentPage,
  isTiloPayConfigured,
} from "@/lib/tilopay";

/* Numero de WhatsApp de la tienda. Si no hay TiloPay configurado,
   el checkout no se bloquea: registra la orden y el cliente confirma
   por WhatsApp. */
const STORE_WHATSAPP = (
  process.env.NEXT_PUBLIC_STORE_WHATSAPP || ""
).replace(/\D/g, "");

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
  /* Sesion obligatoria: la pagina ya redirige, pero el API se
     valida aparte para que nadie cree pedidos sin cuenta. */
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json(
      {
        error:
          "Tu sesion expiro. Entra de nuevo a tu cuenta para pagar.",
        code: "SESSION_REQUIRED",
      },
      { status: 401 }
    );
  }

  /* Freno por IP: 15 pedidos cada 10 minutos, para que una
     cuenta comprometida no llene la base de basura. */
  if (!(await allowCheckout())) {
    return NextResponse.json(
      {
        error:
          "Demasiados pedidos seguidos. Espera unos minutos.",
      },
      { status: 429 }
    );
  }

  let body: CheckoutBody;

  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return badRequest("Cuerpo inválido.");
  }

  const customer = body.customer ?? {};

  /* Respaldo con la cuenta: si el form vino incompleto, se
     completa con lo que hay guardado. Asi el pedido nunca
     se cae por un campo en blanco. */
  const account = await getCustomerById(session.customerId);

  const firstName =
    customer.firstName?.trim() ||
    account?.full_name.split(" ")[0] ||
    "";
  const lastName =
    customer.lastName?.trim() ||
    account?.full_name.split(" ").slice(1).join(" ") ||
    "";
  const email =
    customer.email?.trim().toLowerCase() ||
    account?.email ||
    "";
  const phone =
    customer.phone?.trim() || account?.phone || "";
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

  /* El carrito vive en localStorage, asi que puede venir con
     valores raro de una version vieja o de un item corrupto.
     Se normaliza en vez de rechazar el pedido entero, y solo
     se cae el articulo que de verdad no sirve. */
  const descartados: string[] = [];

  for (const rawItem of body.items) {
    const item = (rawItem ?? {}) as CheckoutItem;

    const id = Number(item.id);
    const quantity = Math.floor(Number(item.quantity));

    const label = String(item.name ?? "articulo").trim();

    if (!Number.isInteger(id) || id <= 0) {
      descartados.push(`${label} (sin id valido)`);
      continue;
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      descartados.push(`${label} (cantidad invalida)`);
      continue;
    }

    const product = await getProductById(id);

    if (!product || product.active !== 1) {
      descartados.push(`${label} (ya no esta disponible)`);
      continue;
    }

    /* Topes generosos: el limite real de negocio es el stock.
       Solo se corta el absurdo para no inflar la orden. */
    const capped = Math.min(quantity, 999);

    if (product.stock !== null && capped > product.stock) {
      descartados.push(
        `${product.name} (quedan ${product.stock})`
      );
      continue;
    }

    validatedItems.push({
      product_id: product.id,
      product_name: product.name,
      unit_price: product.price,
      quantity: capped,
    });

    subtotal += product.price * capped;
  }

  if (validatedItems.length === 0) {
    return badRequest(
      descartados.length > 0
        ? `Ningun articulo del carrito es valido: ${descartados.join(", ")}. Vacia el carrito y volve a agregar.`
        : "El carrito esta vacio."
    );
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

  /* Link publico del pedido: se puede abrir desde el celular
     sin sesion y muestra los articulos con imagen y total. */
  const orderUrl = `${origin}/orden/${orderCode}`;

  /* Sin TiloPay no se cobra online: la orden ya quedo registrada y el
     cliente confirma por WhatsApp. La tienda la ve en el admin como
     "pending" y coordina el pago a mano. */
  if (!isTiloPayConfigured()) {
    const whatsappText = [
      `Hola! Quiero confirmar mi pedido en SportCrz.`,
      ``,
      `Codigo: ${orderCode}`,
      `Ver el detalle de mi pedido: ${orderUrl}`,
      ``,
      `Nombre: ${firstName} ${lastName}`,
      address ? `Direccion: ${address}` : ``,
      city ? `Ciudad: ${city}` : ``,
      ``,
      ...validatedItems.map(
        (item, index) =>
          `${index + 1}. ${item.product_name} x${item.quantity} — $${(
            item.unit_price * item.quantity
          ).toFixed(2)}`
      ),
      ``,
      `Total: $${subtotal.toFixed(2)}`,
    ]
      .filter((line) => line !== null)
      .join("\n");

    return NextResponse.json({
      orderId,
      orderCode,
      total: subtotal,
      orderUrl,
      descartados,
      whatsappUrl: STORE_WHATSAPP
        ? `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(
            whatsappText
          )}`
        : null,
    });
  }

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
