"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { signOutAdminAction } from "@/app/admin/actions";
import { updateOrderStatusAction } from "@/app/admin/pedidos/actions";
import {
  AdminShell,
  OrdersView,
  type OrderQuery,
  type OrderRow,
} from "./SportCrzAdmin";
import { PAGE_SIZE, PAYMENT_OPTIONS, STATUS_OPTIONS } from "./constants";
import styles from "./SportCrzAdmin.module.css";

/* ============================================
   /admin/pedidos — PEDIDOS
   Cablea AdminShell + OrdersView a listOrders()
   REAL. El cambio de estado pasa por la server
   action real (updateOrderStatusAction), que
   valida el estado contra el CHECK de la BD.
============================================ */

export function AdminOrdersPanel({
  userEmail,
  rows,
  initialNotice,
  initialError,
}: {
  userEmail: string;
  rows: OrderRow[];
  initialNotice?: string | null;
  initialError?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [notice, setNotice] = useState<string | null>(initialNotice ?? null);
  const [query, setQuery] = useState<OrderQuery>({
    search: "",
    status: "",
    page: 1,
    pageSize: PAGE_SIZE,
  });

  /* El servidor trae TODOS los pedidos (filterScope "full"),
     asi que el filtrado y el paginado ocurren aqui. */
  const filtered = useMemo(() => {
    const term = query.search.trim().toLowerCase();

    return rows.filter((row) => {
      if (query.status && row.status !== query.status) return false;
      if (!term) return true;

      return (
        row.order_code?.toLowerCase().includes(term) ||
        row.customer_name?.toLowerCase().includes(term) ||
        row.customer_email?.toLowerCase().includes(term)
      );
    });
  }, [rows, query.search, query.status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const visible = useMemo(
    () => filtered.slice((page - 1) * query.pageSize, page * query.pageSize),
    [filtered, page, query.pageSize]
  );

  function updateQuery(patch: Partial<OrderQuery>) {
    setQuery((prev) => ({
      ...prev,
      // Cualquier cambio de filtro vuelve a la primera pagina.
      page: patch.page ?? 1,
      ...patch,
    }));
    setError(null);
  }

  async function onSaveStatus(orderId: number, status: string): Promise<void> {
    const formData = new FormData();
    formData.set("id", String(orderId));
    formData.set("status", status);

    setError(null);
    setNotice(null);

    startTransition(() => {
      void (async () => {
        try {
          await updateOrderStatusAction(formData);
          setNotice("ESTADO ACTUALIZADO.");
        } catch {
          setError("NO SE PUDO ACTUALIZAR EL PEDIDO.");
          router.refresh();
        }
      })();
    });
  }

  function handleSignOut() {
    startTransition(async () => {
      await signOutAdminAction();
    });
  }

  return (
    <AdminShell
      active="orders"
      userEmail={userEmail}
      onSignOut={handleSignOut}
    >
      {notice && <p className={styles.noticeOk}>{notice}</p>}
      <OrdersView
        rows={visible}
        total={filtered.length}
        query={{ ...query, page }}
        onQueryChange={updateQuery}
        statusOptions={STATUS_OPTIONS}
        paymentOptions={PAYMENT_OPTIONS}
        onSaveStatus={onSaveStatus}
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
