import CatalogPage from "@/components/CatalogPage";
import { listProductsByCategory } from "@/lib/database";
import { toCatalogProduct } from "@/lib/catalog-mapper";
import "@/styles/catalog.css";

export const metadata = { title: "Rebajas | SportCrz" };

export const dynamic = "force-dynamic";

export default async function RebajasPage() {
  const products = await listProductsByCategory("rebajas");

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
