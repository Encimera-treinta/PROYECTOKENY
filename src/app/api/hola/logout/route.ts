import { destroyAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export async function POST() {
  await destroyAdminSession();
  redirect("/hola/login");
}
