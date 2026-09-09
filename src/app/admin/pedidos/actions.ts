"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { updateOrderStatus } from "@/lib/database";

const STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") || "");

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !STATUSES.includes(status as (typeof STATUSES)[number])
  ) {
    redirect("/admin/pedidos?error=status");
  }

  updateOrderStatus(id, status);
  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos?updated=1");
}
