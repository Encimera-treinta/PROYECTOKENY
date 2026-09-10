import type { Product } from "@/lib/database";

export type CatalogProductView = {
  id: number;
  name: string;
  price: number;
  oldPrice: number | null;
  image: string;
  badge: string | null;
};

export function toCatalogProduct(
  product: Product
): CatalogProductView {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    oldPrice: product.old_price,
    image: product.image,
    badge: product.badge,
  };
}
