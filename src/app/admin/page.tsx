import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getDatabaseStatus } from "@/lib/database";
import "./login/admin.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireAdmin();
  const databaseStatus = await getDatabaseStatus();
  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <div><span>SPORTCRZ / CONTROL</span><strong>{session.email}</strong></div>
        <div className="admin-top-actions"><Link href="/">VER TIENDA ↗</Link><form action="/api/admin/logout" method="post"><button type="submit">CERRAR SESIÓN</button></form></div>
      </header>
      <section className="admin-hero"><span>01 / DASHBOARD</span><h1>PANEL<br />ADMIN.</h1><p>Control central de la tienda SportCrz.</p></section>
      <section className="admin-grid">
        <article className="admin-card admin-card-primary"><span>01 / CATÁLOGO</span><div><h2>PRODUCTOS</h2><p>{databaseStatus.products} producto(s) activos en el catálogo. Cree, edite y elimine artículos.</p></div><Link href="/admin/productos" className="admin-card-link">GESTIONAR ↗</Link></article>
        <article className="admin-card"><span>02 / PEDIDOS</span><div><h2>ÓRDENES</h2><p>{databaseStatus.orders} pedido(s). Seguimiento de compras y estados de entrega.</p></div><Link href="/admin/pedidos" className="admin-card-link">GESTIONAR ↗</Link></article>
        <article className="admin-card"><span>03 / BASE DE DATOS</span><div><h2>{databaseStatus.engine.toUpperCase()}</h2><p>Conexión local activa. {databaseStatus.users} usuario(s), {databaseStatus.products} producto(s) y {databaseStatus.orders} pedido(s).</p></div><button type="button" disabled>CONECTADA</button></article>
      </section>
      <footer className="admin-footer"><span>SESIÓN ACTIVA</span><strong>{session.email}</strong></footer>
    </main>
  );
}
