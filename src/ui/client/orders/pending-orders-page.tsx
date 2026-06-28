"use client";

import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { Order } from "@/lib/client/types";
import {
  CancelOrderError,
  cancelClientOrder,
  getPendingConfirmationOrders,
} from "@/services/client/client-service";
import CancelOrderModal from "@/ui/client/orders/cancel-order-modal";
import OrderDetailModal from "@/ui/client/orders/order-detail-modal";
import LocalNameWidget from "@/ui/shared/widgets/local-name-widget";

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

function formatPrice(price: number) {
  return `$${price.toLocaleString("es-UY")}`;
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-slate-700" />
      <div className="mt-3 h-5 w-40 rounded bg-gray-200 dark:bg-slate-700" />
      <div className="mt-4 h-3 w-32 rounded bg-gray-100 dark:bg-slate-800" />
      <div className="mt-6 flex gap-3">
        <div className="h-9 w-28 rounded-xl bg-gray-100 dark:bg-slate-800" />
        <div className="h-9 w-32 rounded-xl bg-gray-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export default function PendingOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showSuccessBanner = searchParams.get("cancelled") === "1";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(
    null,
  );
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getPendingConfirmationOrders();
      setOrders(data);
    } catch (loadError) {
      setOrders([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los pedidos en curso.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  function notifyPendingOrdersUpdated() {
    window.dispatchEvent(new Event("pending-orders-updated"));
  }

  function handleOpenCancelModal(order: Order) {
    setCancelError(null);
    setOrderToCancel(order);
  }

  function handleCloseCancelModal() {
    if (isCancelling) return;
    setOrderToCancel(null);
    setCancelError(null);
  }

  async function handleConfirmCancel() {
    if (!orderToCancel) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      await cancelClientOrder(orderToCancel.id);
      setOrderToCancel(null);
      notifyPendingOrdersUpdated();
      await loadOrders();
      router.replace("/client/pending-orders?cancelled=1");
    } catch (cancelErr) {
      if (cancelErr instanceof CancelOrderError && cancelErr.notCancelable) {
        setOrderToCancel(null);
        setError(cancelErr.message);
        await loadOrders();
        notifyPendingOrdersUpdated();
        return;
      }

      setCancelError(
        cancelErr instanceof CancelOrderError
          ? cancelErr.message
          : "No se pudo cancelar el pedido. Intentalo nuevamente.",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div className="mb-8">
        <Link
          href="/client"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 transition-colors hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-300"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Volver al inicio
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Pedidos en curso
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          Pedidos pagados que aún esperan confirmación del local. Podés
          cancelarlos mientras sigan en ese estado.
        </p>
      </div>

      {showSuccessBanner ? (
        <p className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-200">
          Tu pedido fue cancelado.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}

      {!loading && !error && orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            No tenés pedidos en curso
          </p>
        </div>
      ) : null}

      {!loading && !error && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                    Pedido #{order.id}
                  </p>
                  <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                    <LocalNameWidget localId={order.restaurantId} />
                  </p>
                </div>
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">
                  Esperando al local
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                <p>
                  <span className="font-bold text-slate-500 dark:text-slate-400">
                    Fecha:
                  </span>{" "}
                  {formatDate(order.creacion)}
                </p>
                <p>
                  <span className="font-bold text-slate-500 dark:text-slate-400">
                    Total:
                  </span>{" "}
                  {formatPrice(order.total)}
                </p>
                {order.direccion ? (
                  <p className="sm:col-span-2">
                    <span className="font-bold text-slate-500 dark:text-slate-400">
                      Dirección:
                    </span>{" "}
                    {order.direccion}
                  </p>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDetailOrder(order)}
                  className="inline-flex items-center rounded-xl border border-orange-200 px-4 py-2 text-sm font-bold text-orange-700 transition hover:border-orange-300 hover:bg-orange-50 dark:border-orange-500/30 dark:text-orange-300 dark:hover:bg-orange-500/10"
                >
                  Ver detalle
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCancelModal(order)}
                  className="inline-flex items-center rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 transition hover:border-red-300 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                >
                  Cancelar pedido
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {selectedDetailOrder ? (
        <OrderDetailModal
          order={selectedDetailOrder}
          restaurantId={selectedDetailOrder.restaurantId}
          onClose={() => setSelectedDetailOrder(null)}
        />
      ) : null}

      {orderToCancel ? (
        <>
          <CancelOrderModal
            order={orderToCancel}
            isProcessing={isCancelling}
            onClose={handleCloseCancelModal}
            onConfirm={() => void handleConfirmCancel()}
          />
          {cancelError ? (
            <div className="fixed inset-x-4 bottom-6 z-[70] mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 shadow-lg dark:border-red-500/30 dark:bg-red-900 dark:text-red-200">
              {cancelError}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
