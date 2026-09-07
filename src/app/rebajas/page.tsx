import CatalogPage from "@/components/CatalogPage";
import { catalog } from "@/data/catalog";
import "@/styles/shop.css";

export const metadata = { title: "Rebajas | SportCrz" };

export default function RebajasPage() {
  return <CatalogPage {...catalog.rebajas} sale />;
}
