import CatalogPage from "@/components/CatalogPage";
import { listProductsByCategory } from "@/lib/database";
import { toCatalogProduct } from "@/lib/catalog-mapper";
import "@/styles/shop.css";

export const metadata = { title: "Hombres | SportCrz" };

export const dynamic = "force-dynamic";

export default async function HombresPage() {
  const products = await listProductsByCategory("hombres");

  return (
    <CatalogPage
      label="Hombres"
      sections={[
        {
          id: "hombres-destacados",
          title: "Destacados",
          products: products.map(toCatalogProduct),
        },
      ]}
    />
  );
}
