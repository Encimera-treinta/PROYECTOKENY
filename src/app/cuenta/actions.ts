"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getCustomerSession,
  registerCustomer,
  loginCustomer,
  destroyCustomerSession,
  requireCustomer,
} from "@/lib/customer-auth";
import {
  addPaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  updateCustomerProfile,
} from "@/lib/database";

/* ===== PERFIL ===== */

export async function updateProfileAction(formData: FormData) {
  const session = await requireCustomer();

  const fullName = String(formData.get("full_name") || "").trim();
  const phoneRaw = String(formData.get("phone") || "").trim();

  if (!fullName) {
    redirect("/cuenta?error=name");
  }

  await updateCustomerProfile(session.customerId, {
    full_name: fullName,
    phone: phoneRaw || null,
  });

  revalidatePath("/cuenta");
  redirect("/cuenta?updated=profile");
}

/* ===== TARJETAS (solo últimos 4 dígitos por seguridad) ===== */

function detectBrand(number: string): string {
  const n = number.replace(/\s+/g, "");

  if (/^4/.test(n)) return "VISA";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "MASTERCARD";
  if (/^3[47]/.test(n)) return "AMEX";
  if (/^6/.test(n)) return "DISCOVER";
  if (/^36|^30[0-5]/.test(n)) return "DINERS";
  if (/^5[0-4]/.test(n)) return "MAESTRO";
  return "TARJETA";
}

export async function addCardAction(formData: FormData) {
  const session = await requireCustomer();

  const holder = String(formData.get("card_holder") || "").trim();
  const number = String(formData.get("card_number") || "").replace(/\s+/g, "");
  const month = Number(formData.get("card_exp_month"));
  const year = Number(formData.get("card_exp_year"));

  if (!holder) redirect("/cuenta?error=holder");
  if (!/^\d{13,19}$/.test(number)) redirect("/cuenta?error=cardnumber");
  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(year) ||
    year < 2026 ||
    year > 2100
  ) {
    redirect("/cuenta?error=cardexp");
  }

  const last4 = number.slice(-4);
  const brand = detectBrand(number);

  await addPaymentMethod({
    customer_id: session.customerId,
    method: "card",
    label: `${brand} •••• ${last4}`,
    card_last4: last4,
    card_brand: brand,
    card_holder: holder,
    card_exp_month: month,
    card_exp_year: year,
  });

  revalidatePath("/cuenta");
  redirect("/cuenta?added=card");
}

/* ===== YAPPY ===== */

export async function addYappyAction(formData: FormData) {
  const session = await requireCustomer();

  const phone = String(formData.get("yappy_phone") || "").trim();

  if (!/^\+?\d{7,15}$/.test(phone.replace(/[\s\-]/g, ""))) {
    redirect("/cuenta?error=yappyphone");
  }

  await addPaymentMethod({
    customer_id: session.customerId,
    method: "yappy",
    label: `YAPPY ${phone}`,
    yappy_phone: phone,
  });

  revalidatePath("/cuenta");
  redirect("/cuenta?added=yappy");
}

/* ===== DEFAULT / DELETE ===== */

export async function setDefaultPaymentAction(formData: FormData) {
  const session = await requireCustomer();
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    redirect("/cuenta?error=payment");
  }

  await setDefaultPaymentMethod(session.customerId, id);

  revalidatePath("/cuenta");
  redirect("/cuenta?updated=default");
}

export async function deletePaymentAction(formData: FormData) {
  const session = await requireCustomer();
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    redirect("/cuenta?error=payment");
  }

  await deletePaymentMethod(session.customerId, id);

  revalidatePath("/cuenta");
  redirect("/cuenta?deleted=payment");
}

/* ===== AUTH ===== */

/* Solo permite redirigir a rutas internas (evita open redirect). */
function safeNext(raw: string | null): string {
  const next = raw?.trim() || "/cuenta";
  if (next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")) {
    return next;
  }
  return "/cuenta";
}

export async function registerAction(formData: FormData) {
  const result = await registerCustomer({
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    full_name: String(formData.get("full_name") || ""),
    phone: String(formData.get("phone") || "").trim() || null,
  });

  if (!result.ok) {
    redirect(
      `/cuenta/login?error=${result.error}&mode=register&next=${encodeURIComponent(safeNext(String(formData.get("next") || "")))}`
    );
  }

  redirect(safeNext(String(formData.get("next") || "")));
}

export async function loginAction(formData: FormData) {
  const result = await loginCustomer(
    String(formData.get("email") || ""),
    String(formData.get("password") || "")
  );

  if (!result.ok) {
    redirect(
      `/cuenta/login?error=invalid&next=${encodeURIComponent(safeNext(String(formData.get("next") || "")))}`
    );
  }

  redirect(safeNext(String(formData.get("next") || "")));
}

export async function logoutAction() {
  await destroyCustomerSession();
  redirect("/");
}

export async function getMySessionAction() {
  return getCustomerSession();
}
