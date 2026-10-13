"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type {
  AdminLoginLink,
  LinkState,
} from "@/lib/database";
import {
  createLinkAction,
  revokeAllAction,
  revokeLinkAction,
} from "./actions";
import styles from "@/components/sportcrz-admin/SportCrzAdmin.module.css";

const STORE_WHATSAPP = (
  process.env.NEXT_PUBLIC_STORE_WHATSAPP || ""
).replace(/\D/g, "");

type LinkRow = AdminLoginLink & { state: LinkState };

const STATE_STYLE: Record<
  LinkState,
  { label: string; className: string }
> = {
  activo: {
    label: "ACTIVO",
    className: styles.pillGreen,
  },
  usado: {
    label: "USADO",
    className: styles.pillBlue,
  },
  vencido: {
    label: "VENCIDO",
    className: styles.pillNeutral,
  },
  revocado: {
    label: "REVOCADO",
    className: styles.pillRed,
  },
};

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("es-PA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AccesosClient({
  userEmail,
  initialLinks,
}: {
  userEmail: string;
  initialLinks: LinkRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const linkUrl = token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/entrar/${token}`
    : "";

  const whatsappHref = token
    ? `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(
        `Hola! Te dejo el acceso directo al panel de SportCrz.\n\nEntrá con este link: ${linkUrl}\n\nNo lo compartas con nadie.`
      )}`
    : "";

  function handleCreate(formData: FormData) {
    setError("");

    startTransition(async () => {
      const result = await createLinkAction(formData);

      if (result.ok && result.token) {
        setToken(result.token);
      } else {
        setError(result.error ?? "No se pudo crear.");
      }
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(linkUrl);

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError(
        "No se pudo copiar. Copia el link a mano."
      );
    }
  }

  const activos = initialLinks.filter(
    (link) =>
      link.state === "activo" || link.state === "usado"
  ).length;

  return (
    <div className={styles.root}>
      <main className={styles.main}>
        <header className={styles.topbar}>
          <span className={styles.topbarCode}>
            ADMIN / ACCESOS
          </span>

          <div className={styles.topbarActions}>
            <Link
              href="/hola"
              className={styles.topLink}
            >
              VOLVER
            </Link>
          </div>
        </header>

        <div className={styles.mainContent}>
          <div className={styles.overview}>
            <h1 className={styles.overviewTitle}>
              ACCESOS.
            </h1>

            <p className={styles.overviewSub}>
              Crea un link para que alguien entre al panel sin
              escribir contraseña. Funciona como una llave
              personal: quitalo cuando quieras.
            </p>

            {/* AVISO */}

            <div className={styles.noticeErr}>
              <p>
                <strong>Cuidado:</strong> este link da acceso
                total a la tienda (pedidos, clientes, pagos y
                productos). Mándalo solo a quien debe verlo y
                no lo reenvíes.
              </p>
            </div>

            {/* FORMULARIO */}

            <div className={styles.editor}>
              <div className={styles.editorHead}>
                <strong>
                  NUEVO LINK PARA {userEmail}
                </strong>
              </div>

              <form
                action={handleCreate}
                className={styles.editor}
              >
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label htmlFor="label">
                      PARA QUIEN ES
                    </label>
                    <input
                      id="label"
                      name="label"
                      type="text"
                      placeholder="Ej. Mamá"
                      maxLength={60}
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="days">
                      VALIDEZ (DIAS)
                    </label>
                    <input
                      id="days"
                      name="days"
                      type="number"
                      defaultValue={30}
                      min={1}
                      max={90}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.submit}
                  disabled={pending}
                >
                  {pending
                    ? "GENERANDO..."
                    : "GENERAR LINK"}
                </button>
              </form>

              {error ? (
                <p className={styles.noticeErrText}>
                  {error}
                </p>
              ) : null}

              {/* LINK GENERADO */}

              {token ? (
                <div className={styles.noticeOk}>
                  <strong>
                    LINK CREADO. Copialo ahora:
                  </strong>

                  <input
                    readOnly
                    value={linkUrl}
                    onFocus={(event) =>
                      event.currentTarget.select()
                    }
                    style={{
                      width: "100%",
                      marginTop: 10,
                      padding: "10px 12px",
                      background: "#101113",
                      color: "#f2f4e9",
                      border:
                        "1px solid #2a2d33",
                      borderRadius: 8,
                      fontSize: "0.82rem",
                    }}
                    aria-label="Link de acceso"
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      className={styles.cellActionsButton}
                      onClick={handleCopy}
                      style={{
                        minHeight: 48,
                        padding:
                          "9px 14px",
                        border:
                          "1px solid #2a2d33",
                        borderRadius: 7,
                        background:
                          "transparent",
                        color: "#f2f4e9",
                        font:
                          "inherit",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        letterSpacing:
                          "0.12em",
                        cursor: "pointer",
                      }}
                    >
                      {copied
                        ? "COPIADO"
                        : "COPIAR LINK"}
                    </button>

                    {STORE_WHATSAPP ? (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display:
                            "inline-flex",
                          alignItems:
                            "center",
                          minHeight: 48,
                          padding:
                            "9px 14px",
                          border:
                            "1px solid #2a2d33",
                          borderRadius: 7,
                          color: "#f2f4e9",
                          textDecoration:
                            "none",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          letterSpacing:
                            "0.12em",
                        }}
                      >
                        MANDAR POR WHATSAPP
                      </a>
                    ) : null}
                  </div>

                  <p
                    style={{
                      marginTop: 12,
                      fontSize: "0.82rem",
                      lineHeight: 1.6,
                      opacity: 0.75,
                    }}
                  >
                    Solo se muestra una vez. Si lo pierdes,
                    genera otro.
                  </p>
                </div>
              ) : null}
            </div>

            {/* HISTORIAL */}

            <div className={styles.paging}>
              <span className={styles.pagingInfo}>
                {activos} LINKS VIGENTES
              </span>

              {activos > 0 ? (
                <form
                  action={revokeAllAction}
                >
                  <button
                    type="submit"
                    className={styles.deleteBtn}
                    style={{
                      padding:
                        "9px 14px",
                      border: "1px solid #ff5c5c",
                      borderRadius: 7,
                      background:
                        "transparent",
                      color: "#ff5c5c",
                      font: "inherit",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      letterSpacing:
                        "0.12em",
                      minHeight: 48,
                      cursor: "pointer",
                    }}
                  >
                    REVOCAR TODOS
                  </button>
                </form>
              ) : null}
            </div>

            {initialLinks.length === 0 ? (
              <div className={styles.tableCard}>
                <p className={styles.emptyRow}>
                  Todavia no creaste ningun link.
                </p>
              </div>
            ) : (
              <div className={styles.tableCard}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>PARA QUIEN</th>
                      <th>ESTADO</th>
                      <th>CREADO</th>
                      <th>VENCE</th>
                      <th>ACCIONES</th>
                    </tr>
                  </thead>

                  <tbody>
                    {initialLinks.map((link) => {
                      const badge =
                        STATE_STYLE[link.state];

                      return (
                        <tr
                          key={link.id}
                          className={
                            styles.tableRow
                          }
                        >
                          <td data-label="PARA QUIEN">
                            {link.label ||
                              "Sin etiqueta"}
                          </td>

                          <td data-label="ESTADO">
                            <span
                              className={`${styles.badge} ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </td>

                          <td data-label="CREADO">
                            {formatDate(
                              link.created_at
                            )}
                          </td>

                          <td data-label="VENCE">
                            {formatDate(
                              link.expires_at
                            )}
                          </td>

                          <td data-label="ACCIONES">
                            {link.state ===
                            "revocado" ||
                            link.state ===
                              "vencido" ? (
                              <span
                                style={{
                                  opacity: 0.4,
                                }}
                              >
                                —
                              </span>
                            ) : (
                              <form
                                action={
                                  revokeLinkAction
                                }
                              >
                                <input
                                  type="hidden"
                                  name="id"
                                  value={
                                    link.id
                                  }
                                />

                                <button
                                  type="submit"
                                  className={
                                    styles.deleteBtn
                                  }
                                  style={{
                                    padding:
                                      "7px 12px",
                                    border:
                                      "1px solid #ff5c5c",
                                    borderRadius: 7,
                                    background:
                                      "transparent",
                                    color:
                                      "#ff5c5c",
                                    font: "inherit",
                                    fontSize:
                                      "0.82rem",
                                    fontWeight:
                                      700,
                                    letterSpacing:
                                      "0.12em",
                                    minHeight: 48,
                                    cursor:
                                      "pointer",
                                  }}
                                >
                                  REVOCAR
                                </button>
                              </form>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <footer className={styles.shellFooter}>
          SPORTCRZ / CONTROL DE ACCESOS
        </footer>
      </main>
    </div>
  );
}