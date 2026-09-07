import CatalogPage from "@/components/CatalogPage";
import { catalog } from "@/data/catalog";
import "@/styles/shop.css";

export const metadata = { title: "Mujeres | SportCrz" };

export default function MujeresPage() {
  return <CatalogPage {...catalog.mujeres} />;
}
