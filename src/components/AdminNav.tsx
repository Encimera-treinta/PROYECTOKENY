import Link from "next/link";
import { Icon } from "./sportcrz-admin/Icon";

export default function AdminNav({ active }: { active: "inicio" | "productos" | "pedidos" }) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand"><span>SPORTCRZ</span><small>Administración</small></div>
      <nav className="admin-sidebar-nav" aria-label="Navegación administrativa">
        <Link className={active === "inicio" ? "active" : ""} href="/hola"><Icon name="grid" size={17} />Inicio</Link>
        <Link className={active === "productos" ? "active" : ""} href="/hola/productos"><Icon name="box" size={17} />Productos</Link>
        <Link className={active === "pedidos" ? "active" : ""} href="/hola/pedidos"><Icon name="bag" size={17} />Pedidos</Link>
      </nav>
      <div className="admin-sidebar-bottom">
        <Link href="/">Ver tienda</Link>
        <form action="/api/hola/logout" method="post"><button type="submit"><Icon name="logout" size={17} />Cerrar sesión</button></form>
      </div>
    </aside>
  );
}
