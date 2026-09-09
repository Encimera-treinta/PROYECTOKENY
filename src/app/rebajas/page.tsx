import CatalogPage from "@/components/CatalogPage";
import { listProductsByCategory } from "@/lib/database";
import { toCatalogProduct } from "@/lib/catalog-mapper";
import "@/styles/shop.css";

export const metadata = { title: "Rebajas | SportCrz" };

export const dynamic = "force-dynamic";

export default function RebajasPage() {
  const products = listProductsByCategory("rebajas");

  return (
    <CatalogPage
      label="Rebajas"
      sale
      sections={[
        {
          id: "rebajas",
          title: "Últimas unidades",
          products: products.map(toCatalogProduct),
        },
      ]}
    />
  );
}
