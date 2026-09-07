import CatalogPage from "@/components/CatalogPage";
import { catalog } from "@/data/catalog";
import "@/styles/shop.css";

export const metadata = { title: "Hombres | SportCrz" };

export default function HombresPage() {
  return <CatalogPage {...catalog.hombres} />;
}
