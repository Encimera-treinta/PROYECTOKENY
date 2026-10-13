"use server";

import { revalidatePath } from "next/cache";
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
  stock: number | null;
  active: number;
  sort_order: number;
  description: string | null;
};

/* Acepta "25,99" (coma) o "25.99" (punto) y devuelve number. */
function parsePrice(raw: string): number {
  const cleaned = raw.trim().replace(",", ".");
  return Number(cleaned);
}

export type ProductResult =
  | { ok: true; id: number; created: boolean }
  | { ok: false; error: string };

/* Error de validacion: en vez de redirigir con un query
   se devuelve el motivo para que el panel lo muestre
   sin perder lo que el usuario ya escribio. */
class ProductError extends Error {}

async function parseProductForm(
  formData: FormData
): Promise<ProductInput> {
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
  /* Stock vacio = sin control de inventario (NULL). */
  const stock = stockRaw
    ? Number(stockRaw.replace(",", "."))
    : null;
  const sortOrderRaw = String(formData.get("sort_order") || "").trim();
  const sortOrder = Number(sortOrderRaw.replace(",", "."));
  const active = formData.get("active") === "on" ? 1 : 0;
  const description = String(formData.get("description") || "").trim();

  if (!name) throw new ProductError("Ponle un nombre al producto.");

  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    throw new ProductError("Elegí una categoría válida.");
  }

  if (!priceRaw || !Number.isFinite(price) || price < 0) {
    throw new ProductError("El precio no es válido.");
  }

  if (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice < 0)) {
    throw new ProductError("El precio anterior no es válido.");
  }

  if (
    stock !== null &&
    (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock))
  ) {
    throw new ProductError("El stock debe ser un número entero de 0 para arriba.");
  }

  /* Si subieron foto nueva, tiene prioridad sobre la ruta manual. */
  let image = imageRaw || "/img/portfolio-1.jpg";

  if (imageFileData.startsWith("data:image/")) {
    const saved = await saveUploadedImage(imageFileData);

    if (saved) {
      image = saved;
    } else {
      throw new ProductError("La foto no se pudo procesar.");
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
    description: description || null,
  };
}

export async function createProductAction(
  formData: FormData
): Promise<ProductResult> {
  await requireAdmin();

  try {
    const data = await parseProductForm(formData);
    const newId = await createProduct(data);

    revalidatePath("/hola/productos");
    revalidatePath(`/${data.category}`);

    return { ok: true, id: newId, created: true };
  } catch (err) {
    if (err instanceof ProductError) {
      return { ok: false, error: err.message };
    }

    return {
      ok: false,
      error: "No se pudo crear el producto.",
    };
  }
}

export async function updateProductAction(
  formData: FormData
): Promise<ProductResult> {
  await requireAdmin();

  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Producto no válido." };
  }

  if (!(await getProductById(id))) {
    return {
      ok: false,
      error: "Ese producto ya no existe.",
    };
  }

  try {
    const data = await parseProductForm(formData);

    await updateProduct(id, data);

    revalidatePath("/hola/productos");
    revalidatePath(`/${data.category}`);

    return { ok: true, id, created: false };
  } catch (err) {
    if (err instanceof ProductError) {
      return { ok: false, error: err.message };
    }

    return {
      ok: false,
      error: "No se pudo guardar el producto.",
    };
  }
}

export async function deleteProductAction(
  formData: FormData
): Promise<ProductResult> {
  await requireAdmin();

  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Producto no válido." };
  }

  try {
    const product = await getProductById(id);

    await deleteProduct(id);

    /* Borra también la foto si era una imagen subida. */
    if (product?.image?.startsWith("/uploads/")) {
      const fileName = product.image.replace("/uploads/", "");
      await deleteUploadByName(fileName);
    }

    revalidatePath("/hola/productos");
    if (product) revalidatePath(`/${product.category}`);

    return { ok: true, id, created: false };
  } catch {
    return {
      ok: false,
      error: "No se pudo eliminar el producto.",
    };
  }
}
