import Link from "next/link";
import "./not-found.css";

export const metadata = {
  title: "Pagina no encontrada | SportCrz",
};

export default function NotFound() {
  return (
    <main className="nf-page">
      <header className="nf-top">
        <span>SPORTCRZ</span>
        <Link href="/">VOLVER A LA TIENDA</Link>
      </header>

      <section className="nf-body">
        <span className="nf-code">ERROR 404</span>

        <h1>
          NO
          <br />
          ENCONTRADO.
        </h1>

        <p>
          Esta pagina no existe o ya no esta
          disponible. Revisa el link o volve al
          inicio.
        </p>

        <Link href="/" className="nf-btn">
          VOLVER AL INICIO
        </Link>
      </section>

      <footer className="nf-footer">
        <span>SPORTCRZ / 2026</span>
        <span>PANAMÁ</span>
      </footer>
    </main>
  );
}