import { requireAdmin } from "@/lib/admin-auth";
import { listAllProducts } from "@/lib/database";
import { AdminProductsPanel } from "@/components/sportcrz-admin/AdminProductsPanel";

/* Estos dos estilos globales los sigue usando el <ImagePicker />
   que vive dentro del ProductEditor (clases admin-image-*). */
import "../login/admin.css";
import "./productos.css";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  mujeres: "MUJERES",
  hombres: "HOMBRES",
  ninos: "NIÑOS",
  rebajas: "REBAJAS",
};

const ERROR_MESSAGES: Record<string, string> = {
  name: "ERROR: Falta el NOMBRE del producto.",
  category: "ERROR: Categoría inválida.",
  price: "ERROR: El PRECIO debe ser un número mayor o igual a 0 (usa punto o coma, ej. 25.99).",
  old_price: "ERROR: El PRECIO ANTERIOR debe ser un número válido.",
  stock: "ERROR: El STOCK debe ser un número entero (ej. 10).",
  image: "ERROR: La foto no se pudo procesar. Prueba otra imagen o máx. 8 MB.",
  id: "ERROR: Producto no encontrado.",
  missing: "ERROR: Ese producto ya no existe.",
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
  const session = await requireAdmin();
  const params = await searchParams;
  const products = await listAllProducts();

  const editingId = params.edit ? Number(params.edit) : null;
  const editing =
    editingId && Number.isInteger(editingId)
      ? (products.find((p) => p.id === editingId) ?? null)
      : null;

  /* La server action real redirige con ?new=1 o ?edit=ID, asi que
     el editor se abre solo cuando la URL lo pide. */
  const openEditor = Boolean(params.new || editing);

  const errorText = params.error
    ? (ERROR_MESSAGES[params.error] ?? "REVISA LOS DATOS DEL FORMULARIO.")
    : null;

  let notice: string | null = null;

  if (params.created && editing) {
    notice = `PRODUCTO CREADO Y VERIFICADO · ID #${editing.id} · ${CATEGORY_LABELS[editing.category] ?? editing.category} · $${editing.price.toFixed(2)}`;
  } else if (params.updated && editing) {
    notice = `CAMBIOS GUARDADOS · Producto #${editing.id} actualizado en la base de datos.`;
  } else if (params.deleted) {
    notice = "PRODUCTO ELIMINADO DE LA BASE DE DATOS.";
  }

  return (
    <AdminProductsPanel
      userEmail={session.email}
      rows={products}
      initialNotice={notice}
      initialError={errorText}
      openEditor={openEditor}
      editingId={editing?.id ?? null}
    />
  );
}
