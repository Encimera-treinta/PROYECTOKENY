import {
  authenticateAdmin,
  createAdminSession,
} from "@/lib/admin-auth";

import { redirect } from "next/navigation";

export async function POST(
  request: Request
) {
  const formData =
    await request.formData();

  const email =
    String(
      formData.get("email") || ""
    ).trim();

  const password =
    String(
      formData.get("password") || ""
    );

  if (
    !email ||
    !password
  ) {
    redirect(
      "/admin/login?error=missing"
    );
  }

  const admin = await authenticateAdmin(email, password);

  if (!admin) {
    redirect(
      "/admin/login?error=invalid"
    );
  }

  await createAdminSession(
    admin.email
  );

  redirect("/admin");
}
