"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ImagePicker from "@/components/ImagePicker";
import { Icon } from "./Icon";
import type {
  OverviewData,
  OrderQuery,
  OrderRow,
  ProductDraft,
  ProductQuery,
  ProductRow,
} from "./types";
import styles from "./SportCrzAdmin.module.css";

export type {
  OverviewData,
  ProductQuery,
  ProductRow,
  OrderQuery,
  OrderRow,
  ProductDraft,
};

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

/* Estado intermedio del formulario: texto crudo de los inputs.
   Se convierte a ProductDraft (DTO numérico real) al enviar. */
type ProductForm = {
  id?: number;
  name: string;
  category: string;
  price: string;
  old_price: string;
  image: string;
  badge: string;
  stock: string;
  sort_order: string;
  active: string;
  description: string;
  /* Data URL de la foto optimizada en el navegador (opcional). */
  image_file_data: string;
};

/* ============================================
   ICONOS + BADGE
============================================ */

const TONES: Record<string, string> = {
  green: styles.pillGreen,
  amber: styles.pillAmber,
  blue: styles.pillBlue,
  red: styles.pillRed,
  neutral: styles.pillNeutral,
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof TONES;
  children: ReactNode;
}) {
  return (
    <span className={cx(styles.badge, TONES[tone] ?? styles.pillNeutral)}>
      {children}
    </span>
  );
}

/* ============================================
   ADMIN SHELL — sidebar 232px + topbar + móvil
   Renderiza UNA sola vez por ruta protegida.
   Nada de datas falsas: recibe email de la
   sesión real y onSignOut conectado a la
   acción real de cierre de sesión.
============================================ */

export function AdminShell({
  active,
  userEmail,
  onSignOut,
  children,
}: {
  active: "overview" | "products" | "orders";
  userEmail: string;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const pathname = usePathname();

  const links: Array<{
    key: "overview" | "products" | "orders";
    href: string;
    icon: "grid" | "box" | "bag";
    label: string;
  }> = [
    { key: "overview", href: "/admin", icon: "grid", label: "RESUMEN" },
    { key: "products", href: "/admin/productos", icon: "box", label: "PRODUCTOS" },
    { key: "orders", href: "/admin/pedidos", icon: "bag", label: "PEDIDOS" },
  ];

  return (
    <div className={styles.root}>
      {/* ======== SIDEBAR DESKTOP (232px) ======== */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>S</span>
          <div className={styles.brandText}>
            <strong>SPORTCRZ</strong>
            <small>ADMIN</small>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Navegación del panel">
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={cx(
                styles.navLink,
                active === link.key && styles.navLinkActive
              )}
              aria-current={active === link.key ? "page" : undefined}
            >
              <Icon name={link.icon} size={16} />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userBox}>
            <span className={styles.userAvatar}>
              {userEmail?.slice(0, 1).toUpperCase() ?? "A"}
            </span>
            <span className={styles.userText}>
              <strong>{userEmail}</strong>
              <small>SESIÓN ACTIVA</small>
            </span>
          </div>
          <button type="button" className={styles.signOut} onClick={onSignOut}>
            <Icon name="logout" size={15} />
            <span>CERRAR SESIÓN</span>
          </button>
        </div>
      </aside>

      {/* ======== CONTENIDO ======== */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <span className={styles.topbarCode}>SPORTCRZ / CONTROL</span>
          <div className={styles.topbarActions}>
            <Link
              href="/admin"
              className={cx(
                styles.topLink,
                active === "overview" && styles.topLinkActive
              )}
            >
              RESUMEN
            </Link>
            <Link
              href="/admin/productos"
              className={cx(
                styles.topLink,
                active === "products" && styles.topLinkActive
              )}
            >
              PRODUCTOS
            </Link>
            <Link
              href="/admin/pedidos"
              className={cx(
                styles.topLink,
                active === "orders" && styles.topLinkActive
              )}
            >
              PEDIDOS
            </Link>
            <Link href="/" className={styles.topLink} target="_blank" rel="noreferrer">
              VER TIENDA
            </Link>
          </div>
        </header>

        {children}

        <footer className={styles.shellFooter}>
          <span>SESIÓN ACTIVA · {userEmail}</span>
        </footer>
      </div>
    </div>
  );
}

/* ============================================
   RESUMEN
============================================ */

export function OverviewView({
  data,
  statuses,
  payments,
  basePath,
  onCreate,
  onOpenOrder,
  onRetry,
  loading,
  error,
}: {
  data: OverviewData;
  statuses: Array<{ value: string; label: string; tone?: string }>;
  payments: Array<{ value: string; label: string }>;
  basePath: string;
  onCreate: () => void;
  onOpenOrder: (orderId: number) => void;
  onRetry: () => void;
  loading?: boolean;
  error?: string | null;
}) {
  const products = data.products ?? 0;
  return (
    <div className={styles.overview}>
      <h1 className={styles.overviewTitle}>RESUMEN DEL NEGOCIO</h1>
      <p className={styles.overviewSub}>
        Métricas verificadas contra la base de datos real.
      </p>

      {/* Métrica principal */}
      <div className={styles.metricPrimary}>
        <span className={styles.metricPrimaryLabel}>PRODUCTOS ACTIVOS</span>
        <strong className={styles.metricPrimaryValue}>
          {data.activeProducts ?? data.products ?? "—"}
        </strong>
        <p>Catálogo publicado en la tienda.</p>
      </div>

      {/* Métricas secundarias */}
      <div className={styles.metricGrid}>
        <div className={styles.metricCard}>
          <span>PRODUCTOS TOTALES</span>
          <strong>{data.products ?? "—"}</strong>
        </div>
        <div className={styles.metricCard}>
          <span>PEDIDOS</span>
          <strong>{data.orders ?? "—"}</strong>
        </div>
        <div className={styles.metricCard}>
          <span>POR PREPARAR</span>
          <strong>{data.ordersToPrepare ?? "—"}</strong>
        </div>
        <div className={styles.metricCard}>
          <span>STOCK BAJO</span>
          <strong>{data.lowStockCount ?? "—"}</strong>
        </div>
      </div>

      {error && (
        <div className={styles.overviewNoticeErr}>
          <p>{error}</p>
          <button type="button" onClick={onRetry}>REINTENTAR</button>
        </div>
      )}

      {!error && (
        <div className={styles.overviewQuick}>
          <button type="button" className={styles.quickPrimary} onClick={onCreate}>
            <Icon name="plus" size={14} />
            NUEVO PRODUCTO
          </button>
        </div>
      )}

      {loading && <p className={styles.loadingLine}>ACTUALIZANDO…</p>}
    </div>
  );
}

/* ============================================
   PRODUCTOS
============================================ */

export function ProductsView({
  rows,
  total,
  query,
  onQueryChange,
  categories,
  visibilityOptions,
  lowStockThreshold,
  onCreate,
  onEdit,
  onDelete,
  loading,
  error,
  onRetry,
  filterScope,
  hasNextPage,
  page,
  onPageChange,
}: {
  rows: ProductRow[];
  total: number | null;
  query: ProductQuery;
  onQueryChange: (q: Partial<ProductQuery>) => void;
  categories: Array<{ value: string; label: string }>;
  visibilityOptions: Array<{ value: string; label: string }>;
  lowStockThreshold: number;
  onCreate: () => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
  filterScope: "full" | "server" | "loaded";
  hasNextPage: boolean;
  page: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className={styles.products}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <TableSearch
          query={query.search}
          onQueryChange={(q) => onQueryChange({ search: q })}
          placeholder="BUSCAR PRODUCTO…"
        />
        <div className={styles.toolbarSpacer} />
        <button type="button" className={styles.newBtn} onClick={onCreate}>
          <Icon name="plus" size={15} />
          NUEVO PRODUCTO
        </button>
      </div>

      {loading && <p className={styles.loadingLine}>ACTUALIZANDO…</p>}

      {error && (
        <div className={styles.noticeErr}>
          <p>{error}</p>
          <button type="button" onClick={onRetry}>REINTENTAR</button>
        </div>
      )}

      {!error && (
        <>
          {/* TABLA DESKTOP */}
          <div className={styles.tableCard}>
            <table className={styles.table}>
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
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className={styles.emptyRow}>
                      SIN PRODUCTOS. CREA EL PRIMERO.
                    </td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{String(row.id).padStart(2, "0")}</td>
                    <td>
                      <span className={styles.productCell}>
                        {row.image && (
                          <img src={row.image} alt={row.name} width={40} height={40} />
                        )}
                        <span>
                          <strong>{row.name}</strong>
                        </span>
                      </span>
                    </td>
                    <td>{row.category.toUpperCase()}</td>
                    <td>
                      ${(row.price ?? 0).toFixed(2)}
                    </td>
                    <td>{row.stock ?? "—"}</td>
                    <td>
                      <Badge tone={row.active ? "green" : "red"}>
                        {row.active ? "ACTIVO" : "OCULTO"}
                      </Badge>
                    </td>
                    <td>
                      <span className={styles.cellActions}>
                        {onEdit && (
                          <button type="button" onClick={() => onEdit(row.id)}>
                            EDITAR
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => onDelete(row.id)}
                          >
                            ELIMINAR
                          </button>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN (conectada a query/page reales) */}
          <Paged
            total={total}
            hasNextPage={hasNextPage}
            page={page}
            onPageChange={onPageChange}
            pageSize={query.pageSize}
          />
        </>
      )}
    </div>
  );
}

/* ============================================
   PEDIDOS
============================================ */

export function OrdersView({
  rows,
  total,
  query,
  onQueryChange,
  statusOptions,
  paymentOptions,
  onSaveStatus,
  onOpenOrder,
  loading,
  error,
  onRetry,
  filterScope,
  hasNextPage,
  page,
  onPageChange,
}: {
  rows: OrderRow[];
  total: number | null;
  query: OrderQuery;
  onQueryChange: (q: Partial<OrderQuery>) => void;
  statusOptions: Array<{ value: string; label: string; tone?: string }>;
  paymentOptions: Array<{ value: string; label: string }>;
  onSaveStatus: (orderId: number, status: string) => Promise<void>;
  onOpenOrder?: (orderId: number) => void;
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
  filterScope: "full" | "server" | "loaded";
  hasNextPage: boolean;
  page: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className={styles.orders}>
      <div className={styles.toolbar}>
        <TableSearch
          query={query.search}
          onQueryChange={(q) => onQueryChange({ search: q })}
          placeholder="BUSCAR PEDIDO…"
        />
        <div className={styles.toolbarSpacer} />
      </div>

      {loading && <p className={styles.loadingLine}>ACTUALIZANDO…</p>}

      {error && (
        <div className={styles.noticeErr}>
          <p>{error}</p>
          <button type="button" onClick={onRetry}>REINTENTAR</button>
        </div>
      )}

      {!error && (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>CÓDIGO</th>
                <th>CLIENTE</th>
                <th>ARTÍCULOS</th>
                <th>TOTAL</th>
                <th>PAGO</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyRow}>
                    SIN PEDIDOS AÚN.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.order_code}</td>
                  <td>
                    <span className={styles.customerCell}>
                      <strong>{row.customer_name}</strong>
                      {row.customer_email && <small>{row.customer_email}</small>}
                    </span>
                  </td>
                  <td>{row.item_count ?? "—"}</td>
                  <td>${(row.total ?? 0).toFixed(2)}</td>
                  <td>{row.payment_method?.toUpperCase() ?? "—"}</td>
                  <td>
                    <Badge tone={getStatusTone(row.status)}>
                      {row.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td>
                    <span className={styles.cellActions}>
                      {onOpenOrder && (
                        <button type="button" onClick={() => onOpenOrder(row.id)}>
                          VER
                        </button>
                      )}
                      {row.status && (
                        <select
                          className={styles.statusSelect}
                          value={row.status}
                          onChange={(e) => onSaveStatus(row.id, e.target.value)}
                          aria-label="Cambiar estado del pedido"
                        >
                          {statusOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Paged
        total={total}
        hasNextPage={hasNextPage}
        page={page}
        onPageChange={onPageChange}
        pageSize={query.pageSize}
      />
    </div>
  );
}

function getStatusTone(status: string): keyof typeof TONES {
  switch (status) {
    case "paid":
    case "delivered":
      return "green";
    case "pending":
      return "amber";
    case "shipped":
      return "blue";
    case "cancelled":
      return "red";
    default:
      return "neutral";
  }
}

/* ============================================
   BUSCADOR + PAGINACIÓN (compartidos)
============================================ */

export function TableSearch({
  query,
  onQueryChange,
  placeholder,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  placeholder: string;
}) {
  return (
    <div className={styles.search}>
      <Icon name="search" size={14} />
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
      />
    </div>
  );
}

export function Paged({
  total,
  hasNextPage,
  page,
  onPageChange,
  pageSize,
}: {
  total: number | null;
  hasNextPage: boolean;
  page: number;
  onPageChange: (page: number) => void;
  pageSize: number;
}) {
  const totalPages =
    total != null ? Math.max(1, Math.ceil(total / pageSize)) : hasNextPage ? Math.max(1, page + 1) : Math.max(1, page);
  return (
    <div className={styles.paging}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={styles.pagingBtn}
      >
        ←
      </button>
      <span className={styles.pagingInfo}>
        {total != null ? (
          <>PÁGINA {page} · {total} REGISTROS</>
        ) : (
          <>PÁGINA {page}{hasNextPage ? " · MÁS..." : " · FIN"}</>
        )}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={styles.pagingBtn}
      >
        →
      </button>
    </div>
  );
}

/* ============================================
   EDITOR DE PRODUCTO (nuevo / editar)
   Formulario real -> server action real.
   Mantiene categoría, precio, old_price, foto,
   badge, stock, activo, orden y descripción.
============================================ */

export function ProductEditor({
  draft,
  categories,
  visibilityOptions,
  onSubmit,
  onCancel,
  submitting,
  error,
}: {
  draft: ProductDraft | null;
  categories: Array<{ value: string; label: string }>;
  visibilityOptions: Array<{ value: string; label: string }>;
  onSubmit: (draft: ProductDraft) => void;
  onCancel: () => void;
  submitting?: boolean;
  error?: string | null;
}) {
  // El formulario maneja TEXTO (igual que un input HTML real).
  // Al enviar se convierte al DTO numérico real (ProductDraft).
  const [form, setForm] = useState<ProductForm>(() => {
    if (draft) {
      return {
        id: draft.id,
        name: draft.name,
        category: draft.category,
        price: String(draft.price ?? ""),
        old_price: draft.old_price != null ? String(draft.old_price) : "",
        image: draft.image ?? "",
        badge: draft.badge ?? "",
        stock: String(draft.stock ?? 0),
        sort_order: String(draft.sort_order ?? 0),
        active: String(draft.active ?? 1),
        description: draft.description ?? "",
        image_file_data: draft.image_file_data ?? "",
      };
    }
    return {
      name: "",
      category: categories[0]?.value ?? "mujeres",
      price: "",
      old_price: "",
      image: "",
      badge: "",
      stock: "0",
      sort_order: "0",
      active: "1",
      description: "",
      image_file_data: "",
    };
  });

  function update(patch: Partial<ProductForm>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  // Convierte el formulario de texto al DTO real que espera la server action.
  function toDraft(): ProductDraft {
    const price = Number(form.price);
    const oldPrice = form.old_price.trim() === "" ? null : Number(form.old_price);
    const stock = Number(form.stock);
    const sortOrder = Number(form.sort_order);
    return {
      id: form.id,
      name: form.name.trim(),
      category: form.category,
      price: Number.isFinite(price) ? price : 0,
      old_price: oldPrice != null && Number.isFinite(oldPrice) ? oldPrice : null,
      image: form.image.trim() || "/img/portfolio-1.jpg",
      badge: form.badge.trim() || null,
      stock: Number.isFinite(stock) ? stock : 0,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      active: form.active === "1" ? 1 : 0,
      description: form.description.trim() || null,
      image_file_data: form.image_file_data || null,
    };
  }

  return (
    <div className={styles.editor}>
      <div className={styles.editorHead}>
        <strong>{draft ? "EDITAR PRODUCTO" : "NUEVO PRODUCTO"}</strong>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          CANCELAR
        </button>
      </div>

      {/* Subida de foto real: comprime en el navegador y la server
          action la procesa con sharp -> /uploads/... */}
      <ImagePicker
        defaultImage={draft?.image}
        onPicked={(dataUrl) => update({ image_file_data: dataUrl ?? "" })}
      />

      <div className={styles.field}>
        <label htmlFor="name">NOMBRE</label>
        <input
          id="name"
          type="text"
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
          required
          autoComplete="off"
        />
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor="category">CATEGORÍA</label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => update({ category: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="price">PRECIO (USD)</label>
          <input
            id="price"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => update({ price: e.target.value })}
            required
          />
        </div>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor="old_price">PRECIO ANTERIOR (OPCIONAL)</label>
          <input
            id="old_price"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={form.old_price}
            onChange={(e) => update({ old_price: e.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="stock">STOCK</label>
          <input
            id="stock"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={form.stock}
            onChange={(e) => update({ stock: e.target.value })}
            required
          />
        </div>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor="image">IMAGEN (RUTA O URL)</label>
          <input
            id="image"
            type="text"
            value={form.image}
            onChange={(e) => update({ image: e.target.value })}
            placeholder="/img/portfolio-1.jpg"
            autoComplete="off"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="badge">ETIQUETA (OPCIONAL)</label>
          <input
            id="badge"
            type="text"
            value={form.badge}
            onChange={(e) => update({ badge: e.target.value })}
            placeholder="-50% / SALE"
            maxLength={20}
          />
        </div>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor="sort_order">ORDEN</label>
          <input
            id="sort_order"
            type="number"
            inputMode="numeric"
            step="1"
            value={form.sort_order}
            onChange={(e) => update({ sort_order: e.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="active">ESTADO</label>
          <select
            id="active"
            value={form.active}
            onChange={(e) => update({ active: e.target.value })}
          >
            {visibilityOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="description">DESCRIPCIÓN (OPCIONAL)</label>
        <textarea
          id="description"
          rows={5}
          value={form.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Descripción que aparece en la página del producto."
        />
      </div>

      {error && <p className={styles.noticeErrText}>{error}</p>}

      <button
        type="button"
        className={styles.submitBtn}
        disabled={submitting}
        onClick={() => onSubmit(toDraft())}
      >
        {submitting ? "GUARDANDO…" : draft ? "GUARDAR CAMBIOS" : "CREAR PRODUCTO"}
      </button>
    </div>
  );
}
