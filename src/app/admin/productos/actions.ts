"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { requireAdmin } from "@/lib/admin-auth";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
} from "@/lib/database";

const CATEGORIES = ["mujeres", "hombres", "ninos", "rebajas"] as const;

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");
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

  mkdirSync(UPLOADS_DIR, { recursive: true });

  const fileName = `p-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.jpg`;

  writeFileSync(path.join(UPLOADS_DIR, fileName), processed);

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

async function parseProductForm(formData: FormData): Promise<ProductInput> {
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const price = Number(formData.get("price"));
  const oldPriceRaw = String(formData.get("old_price") || "").trim();
  const imageRaw = String(formData.get("image") || "").trim();
  const imageFileData = String(formData.get("image_file_data") || "").trim();
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

  /* Si subieron foto nueva, tiene prioridad sobre la ruta manual. */
  let image = imageRaw || "/img/portfolio-1.jpg";

  if (imageFileData.startsWith("data:image/")) {
    const saved = await saveUploadedImage(imageFileData);

    if (saved) {
      image = saved;
    } else {
      redirect("/admin/productos?error=image");
    }
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
  const data = await parseProductForm(formData);
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

  /* Borra también el archivo si era una imagen subida. */
  if (product?.image?.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "data", "uploads", path.basename(product.image));
    if (existsSync(filePath)) {
      const { unlinkSync } = await import("fs");
      try {
        unlinkSync(filePath);
      } catch {
        // El archivo puede estar bloqueado en Windows; no es crítico.
      }
    }
  }

  revalidatePath("/admin/productos");
  if (product) revalidatePath(`/${product.category}`);
  redirect("/admin/productos?deleted=1");
}
