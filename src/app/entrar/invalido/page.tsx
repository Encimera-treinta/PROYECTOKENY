import Link from "next/link";

export const metadata = {
  title: "Link no valido | SportCrz",
};

export default function InvalidLoginPage() {
  return (
    <main
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
        padding: 32,
        textAlign: "center",
        background: "#080808",
        color: "#ffffff",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <span
        style={{
          fontSize: "0.55rem",
          fontWeight: 800,
          letterSpacing: "0.28em",
          color: "rgba(255,255,255,0.4)",
        }}
      >
        SPORTCRZ / ACCESO
      </span>

      <h1
        style={{
          margin: 0,
          fontSize: "clamp(2rem, 10vw, 3.4rem)",
          fontWeight: 900,
          lineHeight: 0.95,
          letterSpacing: "-0.03em",
        }}
      >
        LINK VENCIDO.
      </h1>

      <p
        style={{
          margin: 0,
          maxWidth: "34ch",
          fontSize: "1rem",
          lineHeight: 1.6,
          color: "rgba(255,255255,0.6)",
        }}
      >
        Este link ya no sirve. Pide uno nuevo y te lo mandamos
        al instante.
      </p>

      <Link
        href="/"
        style={{
          minHeight: 56,
          padding: "0 26px",
          display: "inline-flex",
          alignItems: "center",
          background: "#ffffff",
          color: "#080808",
          textDecoration: "none",
          fontSize: "0.62rem",
          fontWeight: 800,
          letterSpacing: "0.2em",
        }}
      >
        VOLVER A LA TIENDA
      </Link>
    </main>
  );
}