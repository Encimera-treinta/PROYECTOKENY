"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
} from "@/lib/database";

const CATEGORIES = ["mujeres", "hombres", "ninos", "rebajas"] as const;

function parseProductForm(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const price = Number(formData.get("price"));
  const oldPriceRaw = String(formData.get("old_price") || "").trim();
  const image = String(formData.get("image") || "").trim();
  const badgeRaw = String(formData.get("badge") || "").trim();
  const stock = Number(formData.get("stock"));
  const sortOrder = Number(formData.get("sort_order"));
  const active = formData.get("active") === "on" ? 1 : 0;

  if (!name) redirect("/admin/productos?error=name");
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    redirect("/admin/productos?error=category");
  }
  if (!Number.isFinite(price) || price < 0) {
    redirect("/admin/productos?error=price");
  }
  if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
    redirect("/admin/productos?error=stock");
  }

  const oldPrice =
    oldPriceRaw && Number.isFinite(Number(oldPriceRaw)) && Number(oldPriceRaw) > 0
      ? Number(oldPriceRaw)
      : null;

  return {
    name,
    category,
    price: Math.round(price * 100) / 100,
    old_price: oldPrice ? Math.round(oldPrice * 100) / 100 : null,
    image: image || "/img/portfolio-1.jpg",
    badge: badgeRaw || null,
    stock,
    active,
    sort_order: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0,
  };
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  const data = parseProductForm(formData);
  createProduct(data);
  revalidatePath("/admin/productos");
  revalidatePath(`/${data.category}`);
  redirect("/admin/productos?created=1");
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    redirect("/admin/productos?error=id");
  }
  if (!getProductById(id)) {
    redirect("/admin/productos?error=missing");
  }
  const data = parseProductForm(formData);
  updateProduct(id, data);
  revalidatePath("/admin/productos");
  revalidatePath(`/${data.category}`);
  redirect("/admin/productos?updated=1");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    redirect("/admin/productos?error=id");
  }
  const product = getProductById(id);
  deleteProduct(id);
  revalidatePath("/admin/productos");
  if (product) revalidatePath(`/${product.category}`);
  redirect("/admin/productos?deleted=1");
}
