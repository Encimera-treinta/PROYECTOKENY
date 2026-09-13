import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer-auth";
import { loginAction, registerAction } from "../actions";
import "../cuenta.css";

export const dynamic = "force-dynamic";

export const metadata = { title: "Iniciar Sesión | SportCrz" };

const ERRORS: Record<string, string> = {
  invalid: "Correo o contraseña incorrectos.",
  exists: "Ya existe una cuenta con ese correo. Inicia sesión.",
  email: "Ingresa un correo válido.",
  password: "La contraseña debe tener al menos 6 caracteres.",
  name: "Ingresa tu nombre completo.",
};

export default async function CuentaLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string; next?: string }>;
}) {
  const session = await getCustomerSession();

  if (session) {
    redirect("/cuenta");
  }

  const params = await searchParams;
  const isRegister = params.mode === "register";
  const next = params.next && params.next.startsWith("/") ? params.next : "/cuenta";
  const errorText = params.error
    ? (ERRORS[params.error] ?? "Revisa los datos e intenta de nuevo.")
    : null;

  return (
    <main className="cuenta-login-page">
      <header className="cuenta-login-topbar">
        <span>SPORTCRZ / CUENTA</span>
        <Link href="/">VOLVER A LA TIENDA</Link>
      </header>

      <section className="cuenta-login-body">
        <div className="cuenta-login-card">
          <p className="cuenta-login-kicker">
            {isRegister ? "CREA TU CUENTA" : "ACCESA TU CUENTA"}
          </p>

          <h1>
            {isRegister ? (
              <>
                ÚNETE AL
                <br />
                MOVIMIENTO.
              </>
            ) : (
              <>
                HOLA DE
                <br />
                NUEVO.
              </>
            )}
          </h1>

          {errorText && (
            <p className="cuenta-login-error">{errorText}</p>
          )}

          {isRegister ? (
            <form action={registerAction} className="cuenta-login-form">
              <input type="hidden" name="next" value={next} />

              <label>
                NOMBRE COMPLETO
                <input
                  name="full_name"
                  type="text"
                  required
                  autoComplete="name"
                  autoCapitalize="words"
                  enterKeyHint="next"
                />
              </label>

              <label>
                CORREO
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  enterKeyHint="next"
                />
              </label>

              <label>
                TELÉFONO (OPCIONAL)
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  enterKeyHint="next"
                />
              </label>

              <label>
                CONTRASEÑA (MÍN. 6)
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  enterKeyHint="done"
                />
              </label>

              <button type="submit">CREAR CUENTA</button>
            </form>
          ) : (
            <form action={loginAction} className="cuenta-login-form">
              <input type="hidden" name="next" value={next} />

              <label>
                CORREO
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  enterKeyHint="next"
                />
              </label>

              <label>
                CONTRASEÑA
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  enterKeyHint="go"
                />
              </label>

              <button type="submit">ENTRAR</button>
            </form>
          )}

          <p className="cuenta-login-switch">
            {isRegister ? (
              <Link href={`/cuenta/login?next=${encodeURIComponent(next)}`}>
                YA TENGO CUENTA — ENTRAR
              </Link>
            ) : (
              <Link href={`/cuenta/login?mode=register&next=${encodeURIComponent(next)}`}>
                NO TENGO CUENTA — CREAR UNA
              </Link>
            )}
          </p>
        </div>

        <div className="cuenta-login-side">
          <p>
            TU CUENTA SPORTCRZ TE PERMITE VER TUS PEDIDOS, GUARDAR TUS
            TARJETAS DE BANCO GENERAL Y VINCULAR YAPPY PARA PAGAR MÁS RÁPIDO.
          </p>
        </div>
      </section>
    </main>
  );
}
