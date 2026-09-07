import CatalogPage from "@/components/CatalogPage";
import { catalog } from "@/data/catalog";
import "@/styles/shop.css";

export const metadata = { title: "Niños | SportCrz" };

export default function NinosPage() {
  return <CatalogPage {...catalog.ninos} />;
}
