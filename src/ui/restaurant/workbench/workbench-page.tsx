"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import { useAsyncData } from "@/hooks/shared/use-async-data";
import { RESTAURANT_WORKBENCH_REFRESH_EVENT } from "@/lib/restaurant/notifications";
import { getCurrentSession } from "@/services/shared/auth-service";
import type {
  OrderStatus,
  WorkbenchFilters,
  WorkbenchOrder,
} from "@/lib/restaurant/workbench/types";
import {
  ORDER_ADVANCEABLE_STATUSES,
  ORDER_NEXT_STATUS,
} from "@/lib/restaurant/workbench/types";
import {
  acceptOrder,
  advanceOrder,
  fetchWorkbenchOrders,
  rejectOrder,
} from "@/services/restaurant/workbench-service";
import LoadingIndicator from "@/ui/shared/feedback/loading-indicator";
import PanelError from "@/ui/shared/feedback/panel-error";

// ─── Status config ─────────────────────────────────────────────────────────────

const statusLabels: Record<OrderStatus, string> = {
  PENDIENTE_CONFIRMACION_LOCAL: "Pendiente",
  ACEPTADO_LOCAL: "Aceptado",
  EN_CURSO_LOCAL: "En curso",
  EN_CAMINO_LOCAL: "En camino",
  FINALIZADO: "Finalizado",
  RECHAZADO_LOCAL: "Rechazado",
  CANCELADO_CLIENTE: "Cancelado",
};

const advanceActionLabels: Partial<Record<OrderStatus, string>> = {
  ACEPTADO_LOCAL: "Marcar en curso",
  EN_CURSO_LOCAL: "Marcar en camino",
  EN_CAMINO_LOCAL: "Marcar como finalizado",
};

const statusBadgeColors: Record<OrderStatus, string> = {
  PENDIENTE_CONFIRMACION_LOCAL:
    "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  ACEPTADO_LOCAL:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  EN_CURSO_LOCAL:
    "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  EN_CAMINO_LOCAL:
    "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  FINALIZADO:
    "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400",
  RECHAZADO_LOCAL:
    "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  CANCELADO_CLIENTE:
    "bg-gray-100 text-gray-500 dark:bg-gray-500/10 dark:text-gray-400",
};

// ─── Kanban column definitions ─────────────────────────────────────────────────

type KanbanColumnDef = {
  id: string;
  label: string;
  statuses: OrderStatus[];
  accentBorder: string;
  countBadge: string;
};

const KANBAN_COLUMNS: KanbanColumnDef[] = [
  {
    id: "pending",
    label: "Pendiente",
    statuses: ["PENDIENTE_CONFIRMACION_LOCAL"],
    accentBorder: "border-t-amber-400",
    countBadge:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  },
  {
    id: "accepted",
    label: "Aceptado",
    statuses: ["ACEPTADO_LOCAL"],
    accentBorder: "border-t-emerald-400",
    countBadge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
  {
    id: "in-progress",
    label: "En curso",
    statuses: ["EN_CURSO_LOCAL"],
    accentBorder: "border-t-indigo-400",
    countBadge:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400",
  },
  {
    id: "on-the-way",
    label: "En camino",
    statuses: ["EN_CAMINO_LOCAL"],
    accentBorder: "border-t-purple-400",
    countBadge:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  },
  {
    id: "done",
    label: "Finalizado",
    statuses: ["FINALIZADO"],
    accentBorder: "border-t-slate-300",
    countBadge:
      "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400",
  },
  {
    id: "closed",
    label: "Cerrado",
    statuses: ["RECHAZADO_LOCAL", "CANCELADO_CLIENTE"],
    accentBorder: "border-t-red-300",
    countBadge:
      "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString("es-UY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function formatTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString("es-UY", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function formatPrice(price: number) {
  return `$${price.toLocaleString("es-UY")}`;
}

// ─── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={clsx(
        "rounded-full px-3 py-1 text-xs font-extrabold",
        statusBadgeColors[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

// ─── OrderCard ─────────────────────────────────────────────────────────────────

function OrderCard({
  order,
  isSelected,
  onClick,
}: {
  order: WorkbenchOrder;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isPending = order.status === "PENDIENTE_CONFIRMACION_LOCAL";
  const itemCount = order.items.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "w-full rounded-xl border p-3 text-left transition hover:shadow-md",
        isSelected
          ? "border-orange-300 bg-orange-50/60 dark:border-orange-500/40 dark:bg-orange-500/10"
          : isPending
            ? "border-amber-200 bg-amber-50/40 hover:border-orange-200 hover:bg-orange-50/30 dark:border-amber-500/30 dark:bg-amber-500/5 dark:hover:border-orange-500/30"
            : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/30 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-orange-500/30 dark:hover:bg-orange-500/5",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
          #{order.id}
        </span>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
          {formatTime(order.createdAt)}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          {formatPrice(order.total)}
        </span>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
          {itemCount} {itemCount === 1 ? "ítem" : "ítems"}
        </span>
      </div>
      {isPending && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
            Requiere acción
          </span>
        </div>
      )}
    </button>
  );
}

// ─── KanbanColumn ──────────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  orders,
  selectedOrderId,
  onSelectOrder,
}: {
  column: KanbanColumnDef;
  orders: WorkbenchOrder[];
  selectedOrderId: number | null;
  onSelectOrder: (id: number) => void;
}) {
  return (
    <div className="flex w-64 flex-shrink-0 flex-col">
      <div
        className={clsx(
          "mb-3 rounded-xl border border-t-4 border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800",
          column.accentBorder,
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
            {column.label}
          </h3>
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-xs font-extrabold",
              column.countBadge,
            )}
          >
            {orders.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto">
        {orders.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-xs font-medium text-slate-400 dark:border-slate-700 dark:text-slate-500">
            Sin pedidos
          </p>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isSelected={order.id === selectedOrderId}
              onClick={() => onSelectOrder(order.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── OrderDetailPanel ──────────────────────────────────────────────────────────

function OrderDetailPanel({
  order,
  onClose,
  onOrderUpdated,
  onReload,
}: {
  order: WorkbenchOrder;
  onClose: () => void;
  onOrderUpdated: (updated: WorkbenchOrder) => void;
  onReload: () => void;
}) {
  type ActionMode = "accept" | "reject" | null;
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [estimatedTime, setEstimatedTime] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Reset form when a different order is selected
  useEffect(() => {
    setActionMode(null);
    setActionError(null);
    setEstimatedTime("");
    setRejectionReason("");
  }, [order.id]);

  async function handleAccept() {
    if (!estimatedTime.trim()) {
      setActionError("Ingresá el tiempo estimado de entrega.");
      return;
    }
    setIsSubmitting(true);
    setActionError(null);
    try {
      const session = await getCurrentSession();
      const restaurantId = session?.idTipoUsuario
        ? String(session.idTipoUsuario)
        : "";
      const updated = await acceptOrder(restaurantId, order.id, estimatedTime.trim());
      onOrderUpdated(updated);
      setEstimatedTime("");
      onReload();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Error al confirmar el pedido.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    if (!rejectionReason.trim()) {
      setActionError("Ingresá el motivo de rechazo.");
      return;
    }
    setIsSubmitting(true);
    setActionError(null);
    try {
      const session = await getCurrentSession();
      const restaurantId = session?.idTipoUsuario
        ? String(session.idTipoUsuario)
        : "";
      const updated = await rejectOrder(restaurantId, order.id, rejectionReason.trim());
      onOrderUpdated(updated);
      setRejectionReason("");
      onReload();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Error al rechazar el pedido.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAdvance() {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const session = await getCurrentSession();
      const restaurantId = session?.idTipoUsuario
        ? String(session.idTipoUsuario)
        : "";
      const updated = await advanceOrder(restaurantId, order.id);
      onOrderUpdated(updated);
      onReload();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Error al avanzar el pedido.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const canAdvance = ORDER_ADVANCEABLE_STATUSES.has(order.status);
  const nextStatus = ORDER_NEXT_STATUS[order.status];
  const advanceLabel = advanceActionLabels[order.status];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm dark:bg-black/40"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
              Pedido #{order.id}
            </h2>
            <StatusBadge status={order.status} />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-gray-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Cerrar detalle"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 p-6">
          {/* Date */}
          <div>
            <span className="mb-1 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Creado
            </span>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {formatDate(order.createdAt)}
            </p>
          </div>

          {/* Items table */}
          <div>
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Ítems del pedido
            </span>
            {order.items.length === 0 ? (
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                Sin ítems registrados.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800">
                      <th className="px-4 py-2 text-left font-extrabold text-slate-700 dark:text-slate-200">
                        Plato
                      </th>
                      <th className="px-4 py-2 text-center font-extrabold text-slate-700 dark:text-slate-200">
                        Cant.
                      </th>
                      <th className="px-4 py-2 text-right font-extrabold text-slate-700 dark:text-slate-200">
                        Precio unit.
                      </th>
                      <th className="px-4 py-2 text-right font-extrabold text-slate-700 dark:text-slate-200">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 last:border-0 dark:border-slate-800"
                      >
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                          {item.name}
                          {item.discountApplied > 0 && (
                            <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                              -{item.discountApplied}%
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                          {formatPrice(item.unitCost)}
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-slate-800 dark:text-slate-100">
                          {formatPrice(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800">
                      <td
                        colSpan={3}
                        className="px-4 py-3 text-right font-extrabold text-slate-700 dark:text-slate-200"
                      >
                        Total
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-slate-950 dark:text-white">
                        {formatPrice(order.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Delivery info */}
          {(order.address ?? order.instructions) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {order.address && (
                <div>
                  <span className="mb-1 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Dirección de entrega
                  </span>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {order.address}
                  </p>
                </div>
              )}
              {order.instructions && (
                <div>
                  <span className="mb-1 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Indicaciones
                  </span>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {order.instructions}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Optional fields */}
          {order.estimatedTime && (
            <div>
              <span className="mb-1 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                Tiempo estimado de entrega
              </span>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {order.estimatedTime}
              </p>
            </div>
          )}

          {order.comment && (
            <div>
              <span className="mb-1 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                Comentario del cliente
              </span>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {order.comment}
              </p>
            </div>
          )}

          {order.rejectionReason && (
            <div>
              <span className="mb-1 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                Motivo de rechazo
              </span>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {order.rejectionReason}
              </p>
            </div>
          )}

          {/* Advance status action */}
          {canAdvance && advanceLabel && nextStatus && (
            <div className="border-t border-gray-200 pt-5 dark:border-slate-700">
              <p className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                El pedido pasará a{" "}
                <span className="font-extrabold text-slate-700 dark:text-slate-200">
                  {statusLabels[nextStatus]}
                </span>
                .
              </p>
              {actionError && (
                <p className="mb-3 text-sm font-medium text-red-500 dark:text-red-400">
                  {actionError}
                </p>
              )}
              <button
                type="button"
                onClick={handleAdvance}
                disabled={isSubmitting}
                className="w-full rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-orange-600 disabled:opacity-60 active:scale-95 dark:bg-orange-600 dark:hover:bg-orange-500"
              >
                {isSubmitting ? "Actualizando..." : advanceLabel}
              </button>
            </div>
          )}

          {/* Accept / reject actions */}
          {order.status === "PENDIENTE_CONFIRMACION_LOCAL" && (
            <div className="border-t border-gray-200 pt-5 dark:border-slate-700">
              {actionMode === null && (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActionMode("accept");
                      setActionError(null);
                    }}
                    className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-600 active:scale-95 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    Confirmar pedido
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActionMode("reject");
                      setActionError(null);
                    }}
                    className="flex-1 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-extrabold text-red-500 transition hover:bg-red-50 active:scale-95 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    Rechazar pedido
                  </button>
                </div>
              )}

              {actionMode === "accept" && (
                <div className="space-y-3">
                  <label className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Tiempo estimado de entrega
                    </span>
                    <input
                      type="text"
                      value={estimatedTime}
                      onChange={(e) => setEstimatedTime(e.target.value)}
                      placeholder="Ej: 30-40 minutos"
                      disabled={isSubmitting}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                    />
                  </label>
                  {actionError && (
                    <p className="text-sm font-medium text-red-500 dark:text-red-400">
                      {actionError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAccept}
                      disabled={isSubmitting}
                      className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-600 disabled:opacity-60 active:scale-95 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                    >
                      {isSubmitting ? "Confirmando..." : "Confirmar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActionMode(null);
                        setActionError(null);
                        setEstimatedTime("");
                      }}
                      disabled={isSubmitting}
                      className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-extrabold text-slate-600 transition hover:bg-gray-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {actionMode === "reject" && (
                <div className="space-y-3">
                  <label className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Motivo de rechazo
                    </span>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Ej: No tenemos stock del producto solicitado"
                      rows={3}
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                    />
                  </label>
                  {actionError && (
                    <p className="text-sm font-medium text-red-500 dark:text-red-400">
                      {actionError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={isSubmitting}
                      className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-red-600 disabled:opacity-60 active:scale-95"
                    >
                      {isSubmitting ? "Rechazando..." : "Rechazar pedido"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActionMode(null);
                        setActionError(null);
                        setRejectionReason("");
                      }}
                      disabled={isSubmitting}
                      className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-extrabold text-slate-600 transition hover:bg-gray-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const INPUT_CLASS =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20";

export default function RestaurantWorkbenchPage() {
  const [orders, setOrders] = useState<WorkbenchOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Filters
  const [sortBy, setSortBy] = useState<"antiguedad" | "items">("antiguedad");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [orderId, setOrderId] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");

  const loadOrders = useCallback(async () => {
    const session = await getCurrentSession();
    const restaurantId = session?.idTipoUsuario
      ? String(session.idTipoUsuario)
      : "";
    if (!restaurantId) throw new Error("No se pudo obtener el ID del local.");

    const workbenchFilters: WorkbenchFilters = {
      sortBy,
      direction,
      orderId: orderId || undefined,
      startDateTime: startDateTime || undefined,
      endDateTime: endDateTime || undefined,
    };
    return fetchWorkbenchOrders(restaurantId, workbenchFilters);
  }, [sortBy, direction, orderId, startDateTime, endDateTime]);

  const {
    error: loadError,
    isLoading,
    reload,
  } = useAsyncData(loadOrders, {
    onSuccess: (data) => {
      setOrders(data);
      // Keep selection only if the order still exists in the refreshed list
      setSelectedOrderId((currentId) =>
        currentId && data.some((o) => o.id === currentId) ? currentId : null,
      );
    },
  });

  useEffect(() => {
    window.addEventListener(RESTAURANT_WORKBENCH_REFRESH_EVENT, reload);

    return () => {
      window.removeEventListener(RESTAURANT_WORKBENCH_REFRESH_EVENT, reload);
    };
  }, [reload]);

  const ordersByColumn = KANBAN_COLUMNS.map((col) => ({    column: col,
    orders: orders.filter((o) =>
      (col.statuses as string[]).includes(o.status),
    ),
  }));

  function handleOrderUpdated(updated: WorkbenchOrder) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  const selectedOrder =
    orders.find((o) => o.id === selectedOrderId) ?? null;
  const loadErrorMessage =
    loadError?.message ?? "Error al cargar los pedidos.";
  const hasDateFilter = !!(startDateTime || endDateTime);

  return (
    <section className="space-y-6">
      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Ordenar por
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "antiguedad" | "items")}
              className={INPUT_CLASS}
            >
              <option value="antiguedad">Antigüedad</option>
              <option value="items">Cantidad de ítems</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Sentido
            </span>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as "asc" | "desc")}
              className={INPUT_CLASS}
            >
              <option value="desc">Más recientes</option>
              <option value="asc">Más antiguos</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Nº de pedido
            </span>
            <input
              type="number"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Ej: 5"
              className={INPUT_CLASS}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Desde
            </span>
            <input
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              className={INPUT_CLASS}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Hasta
            </span>
            <input
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
        </div>
      </div>

      {/* Loading / error */}
      {isLoading && (
        <div className="py-10">
          <LoadingIndicator label="Cargando pedidos..." />
        </div>
      )}
      {!isLoading && loadError && (
        <PanelError message={loadErrorMessage} onRetry={reload} />
      )}

      {/* Kanban board */}
      {!isLoading && !loadError && (
        <>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {hasDateFilter
              ? "Mostrando pedidos con los filtros aplicados. Selecciona uno para ver el detalle."
              : "Pedidos de las últimas 24 horas. Selecciona uno para ver el detalle."}
          </p>

          {orders.length === 0 ? (
            <p className="py-10 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
              {hasDateFilter
                ? "No hay pedidos para los filtros aplicados."
                : "No hay pedidos en las últimas 24 horas."}
            </p>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-4" style={{ minWidth: "max-content" }}>
                {ordersByColumn.map(({ column, orders: colOrders }) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    orders={colOrders}
                    selectedOrderId={selectedOrderId}
                    onSelectOrder={setSelectedOrderId}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Order detail slide-over */}
      {selectedOrder && (
        <OrderDetailPanel
          order={selectedOrder}
          onClose={() => setSelectedOrderId(null)}
          onOrderUpdated={handleOrderUpdated}
          onReload={reload}
        />
      )}
    </section>
  );
}
