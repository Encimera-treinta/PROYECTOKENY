"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { signOutAdminAction } from "@/app/hola/actions";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/app/hola/productos/actions";
import {
  AdminShell,
  ProductEditor,
  ProductsView,
  type ProductDraft,
  type ProductQuery,
  type ProductRow,
} from "./SportCrzAdmin";
import styles from "./SportCrzAdmin.module.css";
import {
  CATEGORY_OPTIONS,
  LOW_STOCK_THRESHOLD,
  PAGE_SIZE,
  VISIBILITY_OPTIONS,
} from "./constants";

/* ============================================
   /hola/productos — PRODUCTOS
   Cablea AdminShell + ProductsView + ProductEditor
   a listAllProducts() REAL y a las server actions
   reales de crear / editar / eliminar.
============================================ */

/* Convierte el DTO real del producto en el borrador del editor. */
function toDraft(row: ProductRow): ProductDraft {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    old_price: row.old_price ?? null,
    image: row.image ?? "",
    badge: row.badge ?? null,
    stock: row.stock ?? null,
    active: row.active ?? 1,
    sort_order: row.sort_order ?? 0,
    description: row.description ?? null,
  };
}

/* Arma el FormData que esperan las server actions reales.
   OJO: la action lee `active === "on"`, no "1". */
function toFormData(draft: ProductDraft): FormData {
  const formData = new FormData();

  if (draft.id) formData.set("id", String(draft.id));
  formData.set("name", draft.name);
  formData.set("category", draft.category);
  formData.set("price", String(draft.price));
  formData.set("old_price", draft.old_price != null ? String(draft.old_price) : "");
  formData.set("image", draft.image);
  formData.set("badge", draft.badge ?? "");
  formData.set("stock", draft.stock == null ? "" : String(draft.stock));
  formData.set("sort_order", String(draft.sort_order));
  formData.set("active", draft.active === 1 ? "on" : "");
  formData.set("description", draft.description ?? "");

  /* Foto subida: la action la procesa con sharp y devuelve /uploads. */
  if (draft.image_file_data) {
    formData.set("image_file_data", draft.image_file_data);
  }

  return formData;
}

export function AdminProductsPanel({
  userEmail,
  rows,
  initialNotice,
  initialError,
  openEditor,
  editingId,
}: {
  userEmail: string;
  rows: ProductRow[];
  initialNotice?: string | null;
  initialError?: string | null;
  /* Vienen de la URL (?new=1 / ?edit=ID) para que la accion
     real, que redirige, abra el editor en el sitio correcto. */
  openEditor: boolean;
  editingId?: number | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [notice, setNotice] = useState<string | null>(initialNotice ?? null);
  const [editorOpen, setEditorOpen] = useState(openEditor);
  const [draft, setDraft] = useState<ProductDraft | null>(() => {
    if (!editingId) return null;
    const found = rows.find((row) => row.id === editingId);
    return found ? toDraft(found) : null;
  });
  const [query, setQuery] = useState<ProductQuery>({
    search: "",
    category: "",
    visibility: "",
    page: 1,
    pageSize: PAGE_SIZE,
  });

  /* El servidor trae el catalogo completo (filterScope "full"),
     asi que el filtrado y el paginado ocurren aqui. */
  const filtered = useMemo(() => {
    const term = query.search.trim().toLowerCase();

    return rows.filter((row) => {
      if (query.category && row.category !== query.category) return false;
      if (query.visibility && String(row.active ?? 1) !== query.visibility) {
        return false;
      }
      if (!term) return true;

      return (
        row.name?.toLowerCase().includes(term) ||
        row.category?.toLowerCase().includes(term) ||
        String(row.id) === term
      );
    });
  }, [rows, query.search, query.category, query.visibility]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const visible = useMemo(
    () => filtered.slice((page - 1) * query.pageSize, page * query.pageSize),
    [filtered, page, query.pageSize]
  );

  function updateQuery(patch: Partial<ProductQuery>) {
    setQuery((prev) => ({
      ...prev,
      page: patch.page ?? 1,
      ...patch,
    }));
    setError(null);
  }

  function openNew() {
    setDraft(null);
    setEditorOpen(true);
    setError(null);
    setNotice(null);
  }

  function openEdit(id: number) {
    const found = rows.find((row) => row.id === id);
    if (!found) {
      setError("ERROR: Producto no encontrado.");
      return;
    }
    setDraft(toDraft(found));
    setEditorOpen(true);
    setError(null);
    setNotice(null);
  }

  function closeEditor() {
    setEditorOpen(false);
    setDraft(null);
  }

  function handleSubmit(next: ProductDraft) {
    const formData = toFormData(next);

    setError(null);
    setNotice(null);

    startTransition(async () => {
      const result = next.id
        ? await updateProductAction(formData)
        : await createProductAction(formData);

      if (!result?.ok) {
        setError(
          result?.error ||
            "No se pudo guardar el producto."
        );

        return;
      }

      /* El formulario sigue abierto solo si algo fallo:
         asi el usuario no pierde lo que escribio. */
      setEditorOpen(false);
      setDraft(null);
      setNotice(
        result.created
          ? "PRODUCTO CREADO."
          : "PRODUCTO GUARDADO."
      );

      router.refresh();
    });
  }

  function handleDelete(id: number) {
    const found = rows.find((row) => row.id === id);
    const name = found?.name ?? `#${id}`;

    if (!window.confirm(`¿Eliminar "${name}"? Esta accion no se puede deshacer.`)) {
      return;
    }

    const formData = new FormData();
    formData.set("id", String(id));

    setError(null);
    setNotice(null);

    startTransition(async () => {
      const result = await deleteProductAction(formData);

      if (!result?.ok) {
        setError(
          result?.error ||
            "No se pudo eliminar el producto."
        );

        return;
      }

      setNotice("PRODUCTO ELIMINADO.");

      router.refresh();
    });
  }

  function handleSignOut() {
    startTransition(async () => {
      await signOutAdminAction();
    });
  }

  return (
    <AdminShell
      active="products"
      userEmail={userEmail}
      onSignOut={handleSignOut}
    >
      {notice && <p className={styles.noticeOk}>{notice}</p>}

      {editorOpen && (
        <ProductEditor
          draft={draft}
          categories={CATEGORY_OPTIONS}
          visibilityOptions={VISIBILITY_OPTIONS}
          onSubmit={handleSubmit}
          onCancel={closeEditor}
          submitting={isPending}
          error={error}
        />
      )}

      <ProductsView
        rows={visible}
        total={filtered.length}
        query={{ ...query, page }}
        onQueryChange={updateQuery}
        categories={CATEGORY_OPTIONS}
        visibilityOptions={VISIBILITY_OPTIONS}
        lowStockThreshold={LOW_STOCK_THRESHOLD}
        onCreate={openNew}
        onEdit={openEdit}
        onDelete={handleDelete}
        loading={isPending}
        error={error}
        onRetry={() => router.refresh()}
        filterScope="full"
        hasNextPage={page < totalPages}
        page={page}
        onPageChange={(next) => updateQuery({ page: next })}
      />
    </AdminShell>
  );
}
