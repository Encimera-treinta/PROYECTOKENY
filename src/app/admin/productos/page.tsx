import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listAllProducts, type Product } from "@/lib/database";
import ImagePicker from "@/components/ImagePicker";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "./actions";
import "../login/admin.css";
import "./productos.css";

const CATEGORY_LABELS: Record<string, string> = {
  mujeres: "MUJERES",
  hombres: "HOMBRES",
  ninos: "NIÑOS",
  rebajas: "REBAJAS",
};

type FormProduct = {
  id?: number;
  name?: string;
  category?: string;
  price?: number;
  old_price?: number | null;
  image?: string;
  badge?: string | null;
  stock?: number;
  active?: number;
  sort_order?: number;
};

export default async function AdminProductosPage({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string;
    new?: string;
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const products = await listAllProducts();

  const editing: FormProduct | null = params.edit
    ? (products.find((p) => String(p.id) === params.edit) ?? null)
    : null;

  const showForm = Boolean(params.new || editing);

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <div>
          <span>SPORTCRZ / CONTROL</span>
          <strong>GESTIÓN DE PRODUCTOS</strong>
        </div>
        <div className="admin-top-actions">
          <Link href="/admin">DASHBOARD</Link>
          <Link href="/">VER TIENDA ↗</Link>
          <form action="/api/admin/logout" method="post">
            <button type="submit">CERRAR SESIÓN</button>
          </form>
        </div>
      </header>

      <section className="admin-hero">
        <span>02 / CATÁLOGO</span>
        <h1>PRODUCTOS.</h1>
        <p>
          {products.length} producto(s) · Cree, edite o elimine artículos del catálogo.
        </p>
      </section>

      <section className="admin-products-toolbar">
        {(params.created && <p className="admin-flash ok">PRODUCTO CREADO.</p>) ||
          (params.updated && <p className="admin-flash ok">PRODUCTO ACTUALIZADO.</p>) ||
          (params.deleted && <p className="admin-flash ok">PRODUCTO ELIMINADO.</p>) ||
          (params.error && <p className="admin-flash err">REVISA LOS DATOS DEL FORMULARIO.</p>)}

        {!showForm && (
          <Link className="admin-new-btn" href="/admin/productos?new=1">
            + NUEVO PRODUCTO
          </Link>
        )}
      </section>

      {showForm && (
        <section className="admin-form-card">
          <div className="admin-form-head">
            <span>{editing ? `EDITANDO #${editing.id}` : "NUEVO PRODUCTO"}</span>
            <Link href="/admin/productos">CANCELAR ✕</Link>
          </div>

          <form
            className="admin-product-form"
            action={editing ? updateProductAction : createProductAction}
          >
            {editing && <input type="hidden" name="id" value={editing.id} />}

            <ImagePicker defaultImage={editing?.image} />

            <div className="admin-field">
              <label htmlFor="name">NOMBRE</label>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={editing?.name ?? ""}
                required
                maxLength={120}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="words"
                spellCheck={false}
                enterKeyHint="next"
              />
            </div>

            <div className="admin-form-row">
              <div className="admin-field">
                <label htmlFor="category">CATEGORÍA</label>
                <select id="category" name="category" defaultValue={editing?.category ?? "mujeres"}>
                  <option value="mujeres">MUJERES</option>
                  <option value="hombres">HOMBRES</option>
                  <option value="ninos">NIÑOS</option>
                  <option value="rebajas">REBAJAS</option>
                </select>
              </div>

              <div className="admin-field">
                <label htmlFor="price">PRECIO (USD)</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  defaultValue={editing?.price ?? ""}
                  required
                  autoComplete="off"
                  enterKeyHint="next"
                />
              </div>

              <div className="admin-field">
                <label htmlFor="old_price">PRECIO ANTERIOR (OPCIONAL)</label>
                <input
                  id="old_price"
                  name="old_price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  defaultValue={editing?.old_price ?? ""}
                  autoComplete="off"
                  enterKeyHint="next"
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-field">
                <label htmlFor="image">IMAGEN POR RUTA (OPCIONAL SI SUBES FOTO)</label>
                <input
                  id="image"
                  name="image"
                  type="text"
                  defaultValue={editing?.image ?? "/img/portfolio-1.jpg"}
                  placeholder="/img/portfolio-1.jpg"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  enterKeyHint="next"
                />
              </div>

              <div className="admin-field">
                <label htmlFor="badge">ETIQUETA (OPCIONAL)</label>
                <input
                  id="badge"
                  name="badge"
                  type="text"
                  defaultValue={editing?.badge ?? ""}
                  placeholder="-50% / SALE"
                  maxLength={20}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  enterKeyHint="next"
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-field">
                <label htmlFor="stock">STOCK</label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  defaultValue={editing?.stock ?? 0}
                  required
                  autoComplete="off"
                  enterKeyHint="next"
                />
              </div>

              <div className="admin-field">
                <label htmlFor="sort_order">ORDEN</label>
                <input id="sort_order" name="sort_order" type="number" step="1" defaultValue={editing?.sort_order ?? 0} />
              </div>

              <div className="admin-field admin-field-check">
                <label htmlFor="active">ACTIVO</label>
                <input id="active" name="active" type="checkbox" defaultChecked={editing ? editing.active === 1 : true} />
              </div>
            </div>

            <button className="admin-form-submit" type="submit">
              <span>{editing ? "GUARDAR CAMBIOS" : "CREAR PRODUCTO"}</span>
              <span>↗</span>
            </button>
          </form>
        </section>
      )}

      <section className="admin-products-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>PRODUCTO</th>
              <th>CATEGORÍA</th>
              <th>PRECIO</th>
              <th>STOCK</th>
              <th>ESTADO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="admin-empty-row">
                  SIN PRODUCTOS. CREA EL PRIMERO.
                </td>
              </tr>
            )}
            {products.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
          </tbody>
        </table>
      </section>

      {/* CARDS MÓVIL */}
      <section className="admin-products-cards">
        {products.map((product) => (
          <ProductCard key={`card-${product.id}`} product={product} />
        ))}
      </section>

      <footer className="admin-footer">
        <span>SESIÓN ACTIVA / PRODUCTOS</span>
        <strong>{products.length} REGISTROS</strong>
      </footer>

      <nav className="admin-tabbar">
        <Link href="/admin" className="admin-tab">
          <span>PANEL</span>
        </Link>
        <Link href="/admin/productos" className="admin-tab active">
          <span>PRODUCTOS</span>
        </Link>
        <Link href="/admin/pedidos" className="admin-tab">
          <span>PEDIDOS</span>
        </Link>
      </nav>
    </main>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="admin-product-card">
      <div className="admin-product-card-top">
        <img src={product.image} alt={product.name} />
        <div className="admin-product-card-info">
          <h3>{product.name}</h3>
          <div className="admin-product-card-meta">
            <span className="admin-product-card-price">
              ${product.price.toFixed(2)}
              {product.old_price != null && (
                <span className="admin-price-old"> ${product.old_price.toFixed(2)}</span>
              )}
            </span>
            <span className={`admin-pill ${product.active === 1 ? "on" : "off"}`}>
              {product.active === 1 ? "ACTIVO" : "OCULTO"}
            </span>
          </div>
          <div className="admin-product-card-meta">
            <span>{CATEGORY_LABELS[product.category] ?? product.category.toUpperCase()}</span>
            <span className={product.stock === 0 ? "admin-stock-zero" : ""}>
              STOCK: {product.stock}
            </span>
          </div>
        </div>
      </div>
      <div className="admin-product-card-actions">
        <Link href={`/admin/productos?edit=${product.id}`}>EDITAR</Link>
        <form action={deleteProductAction}>
          <input type="hidden" name="id" value={product.id} />
          <button type="submit">ELIMINAR</button>
        </form>
      </div>
    </article>
  );
}

function ProductRow({ product }: { product: Product }) {
  return (
    <tr>
      <td data-label="ID">{String(product.id).padStart(2, "0")}</td>
      <td data-label="PRODUCTO">
        <span className="admin-product-cell">
          <img src={product.image} alt={product.name} />
          <span>{product.name}</span>
        </span>
      </td>
      <td data-label="CATEGORÍA">{CATEGORY_LABELS[product.category] ?? product.category.toUpperCase()}</td>
      <td data-label="PRECIO">
        ${product.price.toFixed(2)}
        {product.old_price != null && (
          <span className="admin-price-old"> ${product.old_price.toFixed(2)}</span>
        )}
      </td>
      <td data-label="STOCK" className={product.stock === 0 ? "admin-stock-zero" : ""}>
        {product.stock}
      </td>
      <td data-label="ESTADO">
        <span className={product.active === 1 ? "admin-pill on" : "admin-pill off"}>
          {product.active === 1 ? "ACTIVO" : "OCULTO"}
        </span>
      </td>
      <td data-label="ACCIONES">
        <span className="admin-row-actions">
          <Link href={`/admin/productos?edit=${product.id}`}>EDITAR</Link>
          <form action={deleteProductAction}>
            <input type="hidden" name="id" value={product.id} />
            <button type="submit">ELIMINAR</button>
          </form>
        </span>
      </td>
    </tr>
  );
}
