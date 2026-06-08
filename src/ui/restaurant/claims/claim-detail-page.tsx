"use client";

import {
  ArrowLeftIcon,
  BanknotesIcon,
  ClockIcon,
  TicketIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAsyncData } from "@/hooks/shared/use-async-data";
import type {
  ClaimOrder,
  ClaimResolutionAction,
  ClaimStatus,
  RestaurantClaim,
  RestaurantClaimDetail,
} from "@/lib/restaurant/claim/types";
import {
  getRestaurantClaimDetail,
  updateRestaurantClaim,
} from "@/services/restaurant/claim-service";
import { getCurrentSession } from "@/services/shared/auth-service";
import LoadingIndicator from "@/ui/shared/feedback/loading-indicator";
import PanelError from "@/ui/shared/feedback/panel-error";

type ClaimDetailPageProps = {
  claimId: string;
};
type ClaimDecisionAction = "later" | ClaimResolutionAction;

const statusLabels: Record<ClaimStatus, string> = {
  pending: "Pendiente",
  in_review: "En revision",
  resolved: "Resuelto",
  rejected: "Rechazado",
};

const statusColors: Record<ClaimStatus, string> = {
  pending:
    "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  in_review:
    "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  resolved:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  rejected: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
};

const resolutionLabels: Record<ClaimResolutionAction, string> = {
  rejection: "Rechazo",
  refund: "Reembolso",
  voucher: "Voucher",
};

const decisionLabels: Record<ClaimDecisionAction, string> = {
  later: "Retomar mas tarde",
  rejection: "Rechazo",
  refund: "Reembolso",
  voucher: "Voucher",
};

const decisionDescriptions: Record<ClaimDecisionAction, string> = {
  later: "Deja el reclamo en revision para continuarlo despues.",
  rejection: "Cierra el reclamo rechazando la solicitud del cliente.",
  refund: "Cierra el reclamo aprobando un reembolso.",
  voucher: "Cierra el reclamo generando una compensacion por voucher.",
};

function StatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span
      className={clsx(
        "rounded-full px-3 py-1 text-xs font-extrabold",
        statusColors[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

function formatDateTimeLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}/${month}/${day} ${hour}:${minute}`;
}

function formatPrice(value: number) {
  return `$${value.toLocaleString("es-UY")}`;
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <div className="flex min-h-11 w-full items-center rounded-xl border border-gray-200 bg-slate-50 px-4 py-2 text-sm font-extrabold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
        {value}
      </div>
    </div>
  );
}

function OrderItemsTable({ order }: { order: ClaimOrder }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800">
      {order.items.map((item) => (
        <div
          key={item.id}
          className="grid gap-3 border-b border-gray-100 px-4 py-4 text-sm last:border-b-0 md:grid-cols-[minmax(0,1fr)_80px_120px] md:items-start dark:border-slate-800"
        >
          <div className="min-w-0">
            <p className="font-extrabold text-slate-900 dark:text-white">
              {item.name}
            </p>
            {item.notes ? (
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                {item.notes}
              </p>
            ) : null}
          </div>
          <p className="font-extrabold text-slate-700 dark:text-slate-200">
            x{item.quantity}
          </p>
          <p className="font-extrabold text-slate-900 dark:text-white">
            {formatPrice(item.unitPrice * item.quantity)}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function RestaurantClaimDetailPage({
  claimId,
}: ClaimDetailPageProps) {
  const [restaurantId, setRestaurantId] = useState("");
  const [claim, setClaim] = useState<RestaurantClaim | null>(null);
  const [order, setOrder] = useState<ClaimOrder | null>(null);
  const [editResponse, setEditResponse] = useState("");
  const [voucherAmount, setVoucherAmount] = useState("");
  const [selectedDecisionAction, setSelectedDecisionAction] =
    useState<ClaimDecisionAction | null>(null);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadClaimDetail = useCallback(async (): Promise<RestaurantClaimDetail> => {
    const session = await getCurrentSession();

    if (!session) {
      throw new Error("No se encontro una sesion activa.");
    }

    const nextRestaurantId = String(session.idTipoUsuario);
    setRestaurantId(nextRestaurantId);

    return getRestaurantClaimDetail(nextRestaurantId, claimId);
  }, [claimId]);

  const { error: loadError, isLoading, reload } = useAsyncData(
    loadClaimDetail,
    {
      onSuccess: (data) => {
        setClaim(data.claim);
        setOrder(data.order);
        resetEditForm(data.claim);
      },
    },
  );

  useEffect(() => {
    if (!formError) {
      return;
    }

    const timeoutId = window.setTimeout(() => setFormError(null), 5000);

    return () => window.clearTimeout(timeoutId);
  }, [formError]);

  function resetEditForm(nextClaim: RestaurantClaim | null) {
    setEditResponse(nextClaim?.response ?? "");
    setVoucherAmount(
      nextClaim?.voucherAmount ? String(nextClaim.voucherAmount) : "",
    );
    setSelectedDecisionAction(null);
    setFormError(null);
  }

  async function refreshClaimDetail() {
    const data = await getRestaurantClaimDetail(restaurantId, claimId);

    setClaim(data.claim);
    setOrder(data.order);
    resetEditForm(data.claim);
  }

  async function saveClaim(
    nextStatus = claim?.status ?? "pending",
    nextResolutionAction = claim?.resolutionAction ?? null,
  ) {
    if (!claim) {
      return;
    }

    try {
      setIsSavingChanges(true);
      setFormError(null);
      await updateRestaurantClaim(restaurantId, {
        ...claim,
        status: nextStatus,
        resolutionAction: nextResolutionAction,
        voucherAmount:
          nextResolutionAction === "voucher" ? Number(voucherAmount) : null,
        response: editResponse.trim(),
      });
      await refreshClaimDetail();
    } catch (error) {
      // Las acciones sobre reclamos no limpian el formulario si fallan, para
      // que el local pueda corregir o reintentar sin perder contexto.
      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el reclamo. Intentalo nuevamente.",
      );
    } finally {
      setIsSavingChanges(false);
    }
  }

  async function confirmDecision() {
    if (!selectedDecisionAction) {
      await saveClaim();
      return;
    }

    if (selectedDecisionAction === "later") {
      await saveClaim("in_review", null);
      return;
    }

    const parsedVoucherAmount = Number(voucherAmount);

    if (
      selectedDecisionAction === "voucher" &&
      (!Number.isFinite(parsedVoucherAmount) || parsedVoucherAmount <= 0)
    ) {
      setFormError("Ingresa un monto valido para el voucher.");
      return;
    }

    await saveClaim(
      selectedDecisionAction === "rejection" ? "rejected" : "resolved",
      selectedDecisionAction,
    );
  }

  const hasChanges =
    Boolean(claim) &&
    (editResponse !== claim?.response ||
      selectedDecisionAction !== null ||
      voucherAmount !==
        (claim?.voucherAmount ? String(claim.voucherAmount) : ""));
  const isClaimClosed = claim?.status === "resolved" || claim?.status === "rejected";
  const loadErrorMessage =
    loadError?.message ?? "No se pudo cargar el detalle del reclamo.";

  return (
    <section className="space-y-6">
      <Link
        href="/restaurant/claims"
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Volver a reclamos
      </Link>

      {isLoading ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
                <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                  Reclamo
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Cargando informacion del reclamo.
                </p>
              </div>
              <div className="p-10">
                <LoadingIndicator label="Cargando reclamo..." />
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
                <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                  Pedido asociado
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Cargando informacion del pedido.
                </p>
              </div>
              <div className="p-10">
                <LoadingIndicator label="Cargando pedido asociado..." />
              </div>
            </section>
          </div>

          <section className="h-fit overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Acciones del reclamo
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Cargando acciones disponibles.
              </p>
            </div>
            <div className="p-10">
              <LoadingIndicator label="Cargando acciones..." />
            </div>
          </section>
        </div>
      ) : loadError ? (
        <PanelError message={loadErrorMessage} onRetry={reload} />
      ) : claim && order ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                    Reclamo #{claim.id}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Pedido #{claim.orderId} - {claim.reason}
                  </p>
                </div>
                <StatusBadge status={claim.status} />
              </div>

              <div className="space-y-5 p-5">
                {claim.resolutionAction ? (
                  <div className="w-fit rounded-full bg-orange-50 px-3 py-1 text-xs font-extrabold text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                    Decision: {resolutionLabels[claim.resolutionAction]}
                    {claim.voucherAmount
                      ? ` - ${formatPrice(claim.voucherAmount)}`
                      : ""}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoField label="Cliente" value={claim.customerName} />
                  <InfoField label="Correo" value={claim.customerEmail} />
                  <InfoField
                    label="Creacion"
                    value={formatDateTimeLabel(claim.createdAt)}
                  />
                  <InfoField
                    label="Ultima actualizacion"
                    value={formatDateTimeLabel(claim.updatedAt)}
                  />
                </div>

                <div>
                  <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Detalle del reclamo
                  </span>
                  <div className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                    {claim.detail}
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
                <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                  Pedido asociado
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Informacion necesaria para evaluar el reclamo.
                </p>
              </div>

              <div className="space-y-5 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoField
                    label="Fecha del pedido"
                    value={formatDateTimeLabel(order.createdAt)}
                  />
                  <InfoField label="Estado del pedido" value={order.status} />
                  <InfoField
                    label="Direccion de entrega"
                    value={order.deliveryAddress}
                  />
                  <InfoField label="Metodo de pago" value={order.paymentMethod} />
                </div>

                <div>
                  <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Platos del pedido
                  </span>
                  <OrderItemsTable order={order} />
                </div>

                <div className="grid gap-3 rounded-xl border border-gray-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex justify-between gap-4 font-bold text-slate-600 dark:text-slate-300">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between gap-4 font-bold text-slate-600 dark:text-slate-300">
                    <span>Envio</span>
                    <span>{formatPrice(order.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-gray-200 pt-3 text-base font-black text-slate-950 dark:border-slate-800 dark:text-white">
                    <span>Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="h-fit overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Acciones del reclamo
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                {isClaimClosed
                  ? "El reclamo ya fue cerrado y no admite nuevas acciones."
                  : "Registra la decision tomada sobre este caso."}
              </p>
            </div>

            <div className="space-y-5 p-5">
              {!isClaimClosed ? (
                <div>
                  <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Decision
                  </span>
                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedDecisionAction("later")}
                      disabled={isSavingChanges}
                      className={clsx(
                        "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                        selectedDecisionAction === "later"
                          ? "border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10"
                          : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10",
                      )}
                    >
                      <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                      <span>
                        <span className="block text-sm font-extrabold text-slate-900 dark:text-white">
                          {decisionLabels.later}
                        </span>
                        <span className="mt-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                          {decisionDescriptions.later}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDecisionAction("rejection")}
                      disabled={isSavingChanges}
                      className={clsx(
                        "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                        selectedDecisionAction === "rejection"
                          ? "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"
                          : "border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-red-500/30 dark:hover:bg-red-500/10",
                      )}
                    >
                      <XCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-500 dark:text-red-400" />
                      <span>
                        <span className="block text-sm font-extrabold text-slate-900 dark:text-white">
                          {decisionLabels.rejection}
                        </span>
                        <span className="mt-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                          {decisionDescriptions.rejection}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDecisionAction("refund")}
                      disabled={isSavingChanges}
                      className={clsx(
                        "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                        selectedDecisionAction === "refund"
                          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                          : "border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10",
                      )}
                    >
                      <BanknotesIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        <span className="block text-sm font-extrabold text-slate-900 dark:text-white">
                          {decisionLabels.refund}
                        </span>
                        <span className="mt-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                          {decisionDescriptions.refund}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDecisionAction("voucher")}
                      disabled={isSavingChanges}
                      className={clsx(
                        "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                        selectedDecisionAction === "voucher"
                          ? "border-orange-200 bg-orange-50 dark:border-orange-500/30 dark:bg-orange-500/10"
                          : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-orange-500/30 dark:hover:bg-orange-500/10",
                      )}
                    >
                      <TicketIcon className="mt-0.5 h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />
                      <span>
                        <span className="block text-sm font-extrabold text-slate-900 dark:text-white">
                          {decisionLabels.voucher}
                        </span>
                        <span className="mt-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                          {decisionDescriptions.voucher}
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}

              {selectedDecisionAction === "voucher" ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Monto del voucher
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={voucherAmount}
                    onChange={(event) => setVoucherAmount(event.target.value)}
                    placeholder="Ej: 300"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                  />
                </label>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  Respuesta interna
                </span>
                <textarea
                  value={editResponse}
                  onChange={(event) => setEditResponse(event.target.value)}
                  rows={6}
                  disabled={isClaimClosed}
                  placeholder="Registra la accion tomada sobre el reclamo."
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                />
              </label>

              {formError && (
                <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                  <p>{formError}</p>
                  <button
                    type="button"
                    onClick={() => setFormError(null)}
                    aria-label="Cerrar error"
                    className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg text-red-500 transition hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/20"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}

              {!isClaimClosed ? (
                <div className="grid gap-3">
                <button
                  type="button"
                  onClick={confirmDecision}
                  disabled={!hasChanges || isSavingChanges}
                  className="flex h-11 cursor-pointer items-center justify-center rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingChanges
                    ? "Guardando..."
                    : selectedDecisionAction
                      ? `Confirmar ${decisionLabels[selectedDecisionAction]}`
                      : "Guardar nota interna"}
                </button>
                {hasChanges ? (
                  <button
                    type="button"
                    onClick={() => resetEditForm(claim)}
                    disabled={isSavingChanges}
                    className="flex h-11 cursor-pointer items-center justify-center rounded-xl bg-slate-100 px-5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                ) : null}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
