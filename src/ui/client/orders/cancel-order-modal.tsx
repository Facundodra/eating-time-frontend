"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";

import type { Order } from "@/lib/client/types";
import LoadingButton from "@/ui/shared/buttons/loading-button";
import LocalNameWidget from "@/ui/shared/widgets/local-name-widget";

type CancelOrderModalProps = {
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
  order: Order;
};

function ReembolsoBrand() {
  return (
    <span className="font-bold text-slate-950 dark:text-slate-50">reembolso</span>
  );
}

function EatingTimeBrand() {
  return (
    <span className="font-bold text-slate-950 dark:text-slate-50">
      Eating<span className="text-red-600 dark:text-red-500">Time</span>
    </span>
  );
}

const SUPPORT_EMAIL = "eating.time.soporte@gmail.com";

function formatPrice(price: number) {
  return `$${price.toLocaleString("es-UY")}`;
}

export default function CancelOrderModal({
  isProcessing,
  onClose,
  onConfirm,
  order,
}: CancelOrderModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <section
        aria-labelledby="cancel-order-title"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-slate-800">
          <div>
            <p className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500">
              Cancelar pedido
            </p>
            <h2
              id="cancel-order-title"
              className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white"
            >
              Pedido #{order.id}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5 text-sm text-slate-600 dark:text-slate-300">
          <p className="font-bold text-slate-900 dark:text-white">
            <LocalNameWidget localId={order.restaurantId} />
          </p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Total: {formatPrice(order.total)}
          </p>
          <div className="space-y-3 leading-6">
            <p className="font-bold text-slate-900 dark:text-white">
              ¿Estás seguro de que querés{" "}
              <span className="text-red-600 dark:text-red-500">cancelar</span> el
              pedido?
            </p>
            <p>
              Una vez cancelado, el restaurante ya no podrá ver tu pedido.
            </p>
            <p>
              Para tu <ReembolsoBrand />, ponete en contacto con el
              equipo de soporte de <EatingTimeBrand />:{ " "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-semibold text-blue-600 underline decoration-blue-600/40 underline-offset-2 transition hover:text-blue-700 dark:text-blue-400 dark:decoration-blue-400/40 dark:hover:text-blue-300"
              >
                {SUPPORT_EMAIL}
              </a>{ " "}
              y especificá el número de pedido y cómo querés que se te reembolse
              tu dinero (cupón o transferencia).
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-5 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Volver
          </button>
          <LoadingButton
            type="button"
            isLoading={isProcessing}
            loadingText="Cancelando..."
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            Sí, cancelar pedido
          </LoadingButton>
        </div>
      </section>
    </div>
  );
}
