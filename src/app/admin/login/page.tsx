import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import "./login.css";

const messages: Record<string, string> = {
  missing: "Completa el correo y la contraseña.",
  invalid: "El correo o la contraseña no son válidos.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getAdminSession()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="admin-login-page">
      <div className="admin-login-shell">
        <header className="admin-login-top">
          <span>SPORTCRZ / CONTROL</span>
          <Link href="/">VOLVER A LA TIENDA</Link>
        </header>
        <section className="admin-login-content">
          <span className="admin-login-index">01 / ACCESO RESTRINGIDO</span>
          <h1>ADMIN.</h1>
          <p className="admin-login-description">Ingresa tus credenciales para acceder al panel.</p>
          <form className="admin-login-form" action="/api/admin/login" method="post">
            {error && <div className="admin-login-error"><span>ERROR</span><p>{messages[error] || "No fue posible iniciar sesión."}</p></div>}
            <div className="admin-field"><label htmlFor="email">CORREO</label><input id="email" name="email" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next" required /></div>
            <div className="admin-field"><label htmlFor="password">CONTRASEÑA</label><input id="password" name="password" type="password" autoComplete="current-password" enterKeyHint="go" required /></div>
            <button className="admin-login-submit" type="submit"><span>ENTRAR AL PANEL</span><span></span></button>
          </form>
        </section>
        <footer className="admin-login-footer"><span>SPORTCRZ / 2026</span><span>CONEXIÓN SEGURA</span></footer>
      </div>
    </main>
  );
}
