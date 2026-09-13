import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Product } from "@/lib/database";
import { getProductById } from "@/lib/database";
import ProductDetail from "@/components/ProductDetail";
import "@/styles/product-detail.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(Number(id));

  if (!product) {
    return { title: "Producto | SportCrz" };
  }

  return {
    title: `${product.name} | SportCrz`,
    description:
      product.description ??
      `${product.name}. ${product.price.toFixed(2)} USD. Disponible en SportCrz.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    notFound();
  }

  const product = await getProductById(productId);

  if (!product || product.active !== 1) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
