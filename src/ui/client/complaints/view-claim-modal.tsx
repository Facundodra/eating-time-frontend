"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";

import type { OrderClaim, OrderClaimStatus } from "@/lib/client/types";

type ViewClaimModalProps = {
  claim: OrderClaim;
  onClose: () => void;
  restaurantName?: string;
};

const claimStatusLabels: Record<OrderClaimStatus, string> = {
  PENDIENTE: "Pendiente de revisión",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
};

const claimStatusColors: Record<OrderClaimStatus, string> = {
  PENDIENTE:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200",
  APROBADO:
    "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300",
  RECHAZADO: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300",
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  return date.toLocaleString("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ViewClaimModal({
  claim,
  onClose,
  restaurantName,
}: ViewClaimModalProps) {
  const displayRestaurantName =
    restaurantName ?? claim.localNombre ?? "Local no disponible";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <section
        aria-labelledby="view-claim-title"
        aria-modal="true"
        className="max-h-[calc(100vh-48px)] w-full max-w-[640px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-slate-800">
          <div>
            <p className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500">
              Reclamo del pedido
            </p>
            <h2
              className="mt-2 text-xl font-black text-slate-950 dark:text-white"
              id="view-claim-title"
            >
              Pedido #{claim.pedidoId}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              {displayRestaurantName}
            </p>
          </div>

          <button
            aria-label="Cerrar"
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            onClick={onClose}
            type="button"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-170px)] space-y-4 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase text-slate-400">
              Estado
            </span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                claimStatusColors[claim.estado]
              }`}
            >
              {claimStatusLabels[claim.estado]}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Enviado el {formatDate(claim.creacion)}
            </span>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <span className="block text-xs font-bold uppercase text-slate-400">
              Tu reclamo
            </span>
            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-slate-800 dark:text-slate-100">
              {claim.descripcion}
            </p>
          </div>

          {claim.nota ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <span className="block text-xs font-bold uppercase text-slate-400">
                Respuesta del restaurante
              </span>
              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-slate-800 dark:text-slate-100">
                {claim.nota}
              </p>
            </div>
          ) : null}

          {claim.estado === "PENDIENTE" ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              El restaurante está revisando tu reclamo. Te avisaremos cuando haya una
              resolución.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
