import CatalogPage from "@/components/CatalogPage";
import { listProductsByCategory } from "@/lib/database";
import { toCatalogProduct } from "@/lib/catalog-mapper";
import "@/styles/catalog.css";

export const metadata = { title: "Niños | SportCrz" };

export const dynamic = "force-dynamic";

export default async function NinosPage() {
  const products = await listProductsByCategory("ninos");

  return (
    <CatalogPage
      label="Niños"
      sections={[
        {
          id: "ninos-destacados",
          title: "Destacados",
          products: products.map(toCatalogProduct),
        },
      ]}
    />
  );
}
