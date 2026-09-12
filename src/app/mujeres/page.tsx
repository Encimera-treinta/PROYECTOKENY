import CatalogPage from "@/components/CatalogPage";
import { listProductsByCategory } from "@/lib/database";
import { toCatalogProduct } from "@/lib/catalog-mapper";
import "@/styles/shop.css";

export const metadata = { title: "Mujeres | SportCrz" };

export const dynamic = "force-dynamic";

export default async function MujeresPage() {
  const products = await listProductsByCategory("mujeres");

  return (
    <CatalogPage
      label="Mujeres"
      sections={[
        {
          id: "mujeres-destacados",
          title: "Destacados",
          products: products.map(toCatalogProduct),
        },
      ]}
    />
  );
}
