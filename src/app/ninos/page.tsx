import CatalogPage from "@/components/CatalogPage";
import { listProductsByCategory } from "@/lib/database";
import { toCatalogProduct } from "@/lib/catalog-mapper";
import "@/styles/shop.css";

export const metadata = { title: "Niños | SportCrz" };

export const dynamic = "force-dynamic";

export default function NinosPage() {
  const products = listProductsByCategory("ninos");

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
