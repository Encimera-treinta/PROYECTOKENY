"use server";

import { revalidatePath } from "next/cache";
import {
  createAdminLoginLink,
  requireAdminForLinks,
  revokeAdminLoginLink,
  revokeAllAdminLoginLinks,
} from "@/lib/database";

export async function createLinkAction(formData: FormData) {
  const admin = await requireAdminForLinks();

  if (!admin) {
    return { ok: false, error: "Sin sesion." };
  }

  const days = Number(formData.get("days")) || 30;
  const label = String(formData.get("label") || "").trim();

  try {
    const { token } = await createAdminLoginLink({
      userId: admin.id,
      label: label || null,
      expiresInDays: days,
    });

    revalidatePath("/hola/accesos");

    /* El token se devuelve una sola vez. */
    return { ok: true, token };
  } catch {
    return {
      ok: false,
      error: "No se pudo crear el link.",
    };
  }
}

export async function revokeLinkAction(formData: FormData) {
  const admin = await requireAdminForLinks();

  if (!admin) return;

  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) return;

  await revokeAdminLoginLink(id);

  revalidatePath("/hola/accesos");
}

export async function revokeAllAction() {
  const admin = await requireAdminForLinks();

  if (!admin) return;

  await revokeAllAdminLoginLinks(admin.id);

  revalidatePath("/hola/accesos");
}