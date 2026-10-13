import {
  authenticateAdmin,
  createAdminSession,
} from "@/lib/admin-auth";

import {
  clearLoginFailures,
  clientIp,
  isLoginBlocked,
  registerLoginFailure,
} from "@/lib/rate-limit";

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
      "/hola/login?error=missing"
    );
  }

  /* Frena la fuerza bruta: 8 FALLOS por IP+correo cada
     10 minutos. Solo cuentan los intentos equivocados: el
     acierto nunca queda bloqueado. */
  if (await isLoginBlocked("admin-login", email)) {
    redirect(
      "/hola/login?error=locked"
    );
  }

  const admin = await authenticateAdmin(email, password);

  if (!admin) {
    const stillOk =
      await registerLoginFailure("admin-login", email);

    if (!stillOk) {
      redirect(
        "/hola/login?error=locked"
      );
    }

    redirect(
      "/hola/login?error=invalid"
    );
  }

  clearLoginFailures(
    "admin-login",
    email,
    await clientIp()
  );

  await createAdminSession(
    admin.email
  );

  redirect("/hola");
}
