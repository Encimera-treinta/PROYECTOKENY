"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  saveUpload,
  deleteUploadByName,
} from "@/lib/database";

const CATEGORIES = ["mujeres", "hombres", "ninos", "rebajas"] as const;

const MAX_UPLOAD_MB = 8;

/* Guarda la imagen enviada como data URL (base64), la
   redimensiona con sharp y devuelve la ruta pública. */
async function saveUploadedImage(
  dataUrl: string
): Promise<string | null> {
  const match = /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i.exec(
    dataUrl
  );

  if (!match) return null;

  const base64 = match[2];
  const sizeBytes = Math.floor((base64.length * 3) / 4);

  if (sizeBytes > MAX_UPLOAD_MB * 1024 * 1024) return null;

  const buffer = Buffer.from(base64, "base64");

  const sharp = (await import("sharp")).default;

  const processed = await sharp(buffer)
    .rotate()
    .resize(1200, 1200, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82 })
    .toBuffer();

  const fileName = `p-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.jpg`;

  await saveUpload(fileName, "image/jpeg", new Uint8Array(processed));

  return `/uploads/${fileName}`;
}

type ProductInput = {
  name: string;
  category: string;
  price: number;
  old_price: number | null;
  image: string;
  badge: string | null;
  stock: number;
  active: number;
  sort_order: number;
};

/* Acepta "25,99" (coma) o "25.99" (punto) y devuelve number. */
function parsePrice(raw: string): number {
  const cleaned = raw.trim().replace(",", ".");
  return Number(cleaned);
}

async function parseProductForm(formData: FormData): Promise<ProductInput> {
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const priceRaw = String(formData.get("price") || "").trim();
  const price = parsePrice(priceRaw);
  const oldPriceRaw = String(formData.get("old_price") || "").trim();
  const oldPrice = oldPriceRaw ? parsePrice(oldPriceRaw) : null;
  const imageRaw = String(formData.get("image") || "").trim();
  const imageFileData = String(formData.get("image_file_data") || "").trim();
  const badgeRaw = String(formData.get("badge") || "").trim();
  const stockRaw = String(formData.get("stock") || "").trim();
  const stock = Number(stockRaw.replace(",", "."));
  const sortOrderRaw = String(formData.get("sort_order") || "").trim();
  const sortOrder = Number(sortOrderRaw.replace(",", "."));
  const active = formData.get("active") === "on" ? 1 : 0;

  if (!name) redirect("/admin/productos?new=1&error=name");
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    redirect("/admin/productos?new=1&error=category");
  }
  if (!priceRaw || !Number.isFinite(price) || price < 0) {
    redirect("/admin/productos?new=1&error=price");
  }
  if (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice < 0)) {
    redirect("/admin/productos?new=1&error=old_price");
  }
  if (!stockRaw || !Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
    redirect("/admin/productos?new=1&error=stock");
  }

  /* Si subieron foto nueva, tiene prioridad sobre la ruta manual. */
  let image = imageRaw || "/img/portfolio-1.jpg";

  if (imageFileData.startsWith("data:image/")) {
    const saved = await saveUploadedImage(imageFileData);

    if (saved) {
      image = saved;
    } else {
      redirect("/admin/productos?new=1&error=image");
    }
  }

  return {
    name,
    category,
    price: Math.round(price * 100) / 100,
    old_price: oldPrice && oldPrice > 0 ? Math.round(oldPrice * 100) / 100 : null,
    image,
    badge: badgeRaw || null,
    stock,
    active,
    sort_order: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0,
  };
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  const data = await parseProductForm(formData);
  const newId = await createProduct(data);
  revalidatePath("/admin/productos");
  revalidatePath(`/${data.category}`);
  /* Redirige directo al formulario del producto creado,
     con su foto y datos cargados para verificarlo. */
  redirect(`/admin/productos?edit=${newId}&created=1`);
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    redirect(`/admin/productos?edit=${id || ""}&error=id`);
  }
  if (!(await getProductById(id))) {
    redirect("/admin/productos?error=missing");
  }
  const data = await parseProductForm(formData);
  await updateProduct(id, data);
  revalidatePath("/admin/productos");
  revalidatePath(`/${data.category}`);
  redirect(`/admin/productos?edit=${id}&updated=1`);
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    redirect("/admin/productos?error=id");
  }
  const product = await getProductById(id);
  await deleteProduct(id);

  /* Borra también la foto si era una imagen subida. */
  if (product?.image?.startsWith("/uploads/")) {
    const fileName = product.image.replace("/uploads/", "");
    await deleteUploadByName(fileName);
  }

  revalidatePath("/admin/productos");
  if (product) revalidatePath(`/${product.category}`);
  redirect("/admin/productos?deleted=1");
}
