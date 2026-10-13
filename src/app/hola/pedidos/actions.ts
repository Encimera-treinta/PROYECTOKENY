"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { updateOrderStatus } from "@/lib/database";

const STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatusResult =
  | { ok: true }
  | { ok: false; error: string };

/* Esta accion no redirige: el panel la llama desde el
   navegador y un redirect() lanza una excepcion que el
   try/catch del panel tomaba por error, aunque el pedido
   si se habia guardado. Devuelve el resultado y quien
   llama refresca. */
export async function updateOrderStatusAction(
  formData: FormData
): Promise<OrderStatusResult> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const status = String(
    formData.get("status") || ""
  );

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !STATUSES.includes(
      status as (typeof STATUSES)[number]
    )
  ) {
    return {
      ok: false,
      error: "PEDIDO O ESTADO NO VALIDO.",
    };
  }

  try {
    await updateOrderStatus(id, status);
  } catch {
    return {
      ok: false,
      error:
        "NO SE PUDO GUARDAR EL ESTADO DEL PEDIDO.",
    };
  }

  revalidatePath("/hola/pedidos");

  return { ok: true };
}
