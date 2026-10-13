"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { signOutAdminAction } from "@/app/hola/actions";
import { AdminShell, OverviewView, type OverviewData } from "./SportCrzAdmin";
import { PAYMENT_OPTIONS, STATUS_OPTIONS } from "./constants";

/* ============================================
   /hola — RESUMEN
   Cablea AdminShell + OverviewView a los datos
   REALES que trae el servidor (getOverviewMetrics).
   Los botones navegan a las rutas reales; no hay
   datos de ejemplo en ningun lado.
============================================ */

export function AdminOverviewPanel({
  userEmail,
  data,
}: {
  userEmail: string;
  data: OverviewData;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOutAdminAction();
    });
  }

  return (
    <AdminShell
      active="overview"
      userEmail={userEmail}
      onSignOut={handleSignOut}
    >
      <OverviewView
        data={data}
        statuses={STATUS_OPTIONS}
        payments={PAYMENT_OPTIONS}
        basePath="/hola"
        onCreate={() => router.push("/hola/productos?new=1")}
        onOpenOrder={() => router.push("/hola/pedidos")}
        onRetry={() => router.refresh()}
        loading={isPending}
      />
    </AdminShell>
  );
}
