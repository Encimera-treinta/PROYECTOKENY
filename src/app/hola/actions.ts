"use server";

import { redirect } from "next/navigation";
import { destroyAdminSession } from "@/lib/admin-auth";

export async function signOutAdminAction() {
  await destroyAdminSession();
  redirect("/hola/login");
}
