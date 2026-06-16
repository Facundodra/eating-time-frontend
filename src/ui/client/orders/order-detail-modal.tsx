"use client";

import { useState } from "react";
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import type { Order, OrderHistoryStatus } from "@/lib/client/types";
import LocalNameWidget from "@/ui/shared/widgets/local-name-widget";

type OrderDetailModalProps = {
  onClose: () => void;
  order: Order;
  restaurantId: number;
};

const statusLabels: Record<OrderHistoryStatus, string> = {
  PENDIENTE_CONFIRMACION_LOCAL: "Esperando al local",
  ACEPTADO_LOCAL: "Aceptado",
  EN_CURSO_LOCAL: "En preparación",
  EN_CAMINO_LOCAL: "En camino",
  FINALIZADO: "Finalizado",
  RECHAZADO_LOCAL: "Rechazado",
  CANCELADO_CLIENTE: "Cancelado",
};

const statusColors: Record<OrderHistoryStatus, string> = {
  PENDIENTE_CONFIRMACION_LOCAL: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
  ACEPTADO_LOCAL: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  EN_CURSO_LOCAL: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  EN_CAMINO_LOCAL: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  FINALIZADO: "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300",
  RECHAZADO_LOCAL: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  CANCELADO_CLIENTE: "bg-gray-200 text-gray-600 dark:bg-slate-800 dark:text-slate-300",
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

function formatPrice(price: number | null | undefined) {
  if (price == null) return "-";

  return `$${price.toLocaleString("es-UY")}`;
}

function activeItems(order: Order) {
  return order.items.filter((item) => item.eliminacion == null);
}

function normalizeInvoiceUrl(url: string) {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) return trimmedUrl;
  if (trimmedUrl.startsWith("/api/backend/")) return trimmedUrl;
  if (trimmedUrl.startsWith("/api/")) return `/api/backend${trimmedUrl}`;
  if (trimmedUrl.startsWith("api/")) return `/api/backend/${trimmedUrl}`;

  const backendBaseUrl = (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    ""
  ).replace(/\/$/, "");

  if (!backendBaseUrl) return trimmedUrl;

  try {
    const backendUrl = new URL(backendBaseUrl);
    const invoiceUrl = new URL(trimmedUrl);

    if (invoiceUrl.origin === backendUrl.origin) {
      return `/api/backend${invoiceUrl.pathname}${invoiceUrl.search}`;
    }
  } catch {
    return trimmedUrl;
  }

  return trimmedUrl;
}

export default function OrderDetailModal({
  onClose,
  order,
  restaurantId,
}: OrderDetailModalProps) {
  const items = activeItems(order);
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
  const invoiceUrl = order.urlFactura ? normalizeInvoiceUrl(order.urlFactura) : null;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <section
        aria-labelledby="order-detail-title"
        aria-modal="true"
        className="max-h-[calc(100vh-48px)] w-full max-w-[760px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-slate-800">
          <div>
            <p className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500">
              Detalle del pedido
            </p>
            <h2
              className="mt-2 text-xl font-black text-slate-950 dark:text-white"
              id="order-detail-title"
            >
              Pedido #{order.id}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              <LocalNameWidget localId={restaurantId} /> - {formatDate(order.creacion)}
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

        <div className="max-h-[calc(100vh-170px)] overflow-y-auto px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <span className="block text-xs font-bold uppercase text-slate-400">
                Estado
              </span>
              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusColors[order.estado]}`}
              >
                {statusLabels[order.estado]}
              </span>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <span className="block text-xs font-bold uppercase text-slate-400">
                Ítems
              </span>
              <span className="mt-2 block text-sm font-extrabold text-slate-900 dark:text-white">
                {items.reduce((sum, item) => sum + item.cantidad, 0)}
              </span>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <span className="block text-xs font-bold uppercase text-slate-400">
                Total
              </span>
              <span className="mt-2 block text-sm font-extrabold text-orange-700 dark:text-orange-300">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          <section className="mt-5 rounded-xl border border-gray-100 dark:border-slate-800">
            <div className="border-b border-gray-100 px-4 py-3 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Platos
              </h3>
            </div>

            {items.length === 0 ? (
              <p className="px-4 py-6 text-sm font-medium text-slate-400 dark:text-slate-500">
                No hay ítems para mostrar.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {items.map((item) => (
                  <div
                    className="grid gap-3 px-4 py-4 text-sm sm:grid-cols-[minmax(0,1fr)_80px_100px_100px] sm:items-center"
                    key={item.id}
                  >
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900 dark:text-white">
                        {item.nombre ?? `Plato #${item.platoId}`}
                      </p>
                      {item.descuentoAplicado > 0 ? (
                        <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                          Descuento aplicado: {formatPrice(item.descuentoAplicado)}
                        </p>
                      ) : null}
                    </div>
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      x{item.cantidad}
                    </span>
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      {formatPrice(item.costoUnitario)}
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {formatPrice(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoBlock label="Dirección" value={order.direccion} />
            <InfoBlock label="Indicaciones" value={order.indicaciones} />
            <InfoBlock label="Comentario" value={order.comentario} />
            <InfoBlock label="Motivo de rechazo" value={order.motivoRechazo} />
            <InfoBlock label="Tiempo estimado" value={order.tiempoEstimado} />
            <InfoBlock
              label="Descuento"
              value={order.descuento != null ? formatPrice(order.descuento) : null}
            />
          </section>

          {invoiceUrl ? (
            <div className="mt-5">
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-orange-200 px-4 py-2 text-sm font-extrabold text-orange-700 transition hover:border-orange-300 hover:bg-orange-50 dark:border-orange-500/30 dark:text-orange-300 dark:hover:bg-orange-500/10"
                onClick={() => setIsInvoicePreviewOpen(true)}
                type="button"
              >
                <DocumentTextIcon className="h-4 w-4" />
                Ver factura
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>

    {isInvoicePreviewOpen && invoiceUrl ? (
      <InvoicePreviewModal
        invoiceUrl={invoiceUrl}
        onClose={() => setIsInvoicePreviewOpen(false)}
        orderId={order.id}
      />
    ) : null}
    </>
  );
}

function InvoicePreviewModal({
  invoiceUrl,
  onClose,
  orderId,
}: {
  invoiceUrl: string;
  onClose: () => void;
  orderId: number;
}) {
  const fileName = `factura-pedido-${orderId}.pdf`;
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function handleDownload() {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const response = await fetch(invoiceUrl);

      if (!response.ok) {
        throw new Error("No se pudo descargar la factura.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setDownloadError(
        error instanceof Error
          ? error.message
          : "No se pudo descargar la factura.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/20 px-3 py-4 backdrop-blur-md dark:bg-slate-950/30">
      <section
        aria-labelledby="invoice-preview-title"
        aria-modal="true"
        className="flex max-h-[calc(100vh-32px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        role="dialog"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-slate-800 sm:px-5">
          <div>
            <p className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500">
              Factura
            </p>
            <h2
              className="mt-1 text-base font-black text-slate-950 dark:text-white sm:text-lg"
              id="invoice-preview-title"
            >
              Pedido #{orderId}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-extrabold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:bg-orange-300 dark:bg-orange-600 dark:hover:bg-orange-500 dark:disabled:bg-orange-900/60"
              disabled={isDownloading}
              onClick={() => void handleDownload()}
              type="button"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {isDownloading ? "Descargando..." : "Descargar"}
            </button>
            <button
              aria-label="Cerrar factura"
              className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              onClick={onClose}
              type="button"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {downloadError ? (
          <p className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {downloadError}
          </p>
        ) : null}

        <div className="min-h-0 flex-1 bg-slate-100 dark:bg-slate-950">
          <object
            aria-label={`Factura del pedido ${orderId}`}
            className="h-[72vh] w-full"
            data={invoiceUrl}
            type="application/pdf"
          >
            <div className="flex h-[72vh] flex-col items-center justify-center gap-3 px-4 text-center">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                No se pudo previsualizar el PDF.
              </p>
              <a
                className="inline-flex items-center gap-2 rounded-xl border border-orange-200 px-4 py-2 text-sm font-extrabold text-orange-700 transition hover:border-orange-300 hover:bg-orange-50 dark:border-orange-500/30 dark:text-orange-300 dark:hover:bg-orange-500/10"
                href={invoiceUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Abrir factura
              </a>
            </div>
          </object>
        </div>
      </section>
    </div>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <span className="block text-xs font-bold uppercase text-slate-400">
        {label}
      </span>
      <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}
