import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import {
  listAdminLoginLinks,
  requireAdminForLinks,
} from "@/lib/database";
import AccesosClient from "./AccesosClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Accesos | SportCrz Admin",
};

export default async function AccesosPage() {
  await requireAdmin();

  const admin = await requireAdminForLinks();

  if (!admin) redirect("/hola/login");

  const links = await listAdminLoginLinks(admin.id);

  return (
    <AccesosClient
      userEmail={admin.email}
      initialLinks={links}
    />
  );
}