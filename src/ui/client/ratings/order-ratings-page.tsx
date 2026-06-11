"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HandThumbUpIcon } from "@heroicons/react/24/outline";

import type { Order, OrderRating } from "@/lib/client/types";
import { getOrderHistory } from "@/services/client/client-service";
import OrderDetailModal from "@/ui/client/orders/order-detail-modal";
import LocalNameWidget from "@/ui/shared/widgets/local-name-widget";
import OrderRatingModal from "@/ui/client/ratings/order-rating-modal";

const PAGE_SIZE = 100;

function isOrderRated(order: Order) {
  return order.hasLocalRating || Boolean(order.calificacionLocal);
}

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

function itemCount(order: Order) {
  return order.items
    .filter((item) => item.eliminacion == null)
    .reduce((sum, item) => sum + item.cantidad, 0);
}

async function getUnratedFinishedOrders() {
  let page = 0;
  let totalPages = 1;
  const orders: Order[] = [];

  while (page < totalPages) {
    const response = await getOrderHistory({
      page,
      size: PAGE_SIZE,
      ordenarPor: "fecha",
      direccion: "desc",
    });

    totalPages = response.totalPages;
    orders.push(
      ...response.orders.filter(
        (order) => order.estado === "FINALIZADO" && !isOrderRated(order),
      ),
    );
    page += 1;
  }

  return orders;
}

function OrderRatingSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="h-4 w-1/4 rounded bg-gray-200" />
        <div className="h-8 w-24 rounded-md bg-gray-100" />
      </div>
      <div className="h-3 w-1/3 rounded bg-gray-100" />
      <div className="flex items-center justify-between pt-1">
        <div className="h-3 w-1/4 rounded bg-gray-100" />
        <div className="h-4 w-1/5 rounded bg-gray-200" />
      </div>
    </div>
  );
}

export default function OrderRatingsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(
    null,
  );
  const [selectedRatingOrder, setSelectedRatingOrder] = useState<Order | null>(
    null,
  );

  useEffect(() => {
    let ignore = false;

    async function loadOrders() {
      setLoading(true);
      setError(null);

      try {
        const data = await getUnratedFinishedOrders();
        if (!ignore) setOrders(data);
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los pedidos para calificar.",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadOrders();

    return () => {
      ignore = true;
    };
  }, []);

  function handleRatingSaved(orderId: number, rating: OrderRating) {
    void rating;
    setOrders((currentOrders) =>
      currentOrders.filter((order) => order.id !== orderId),
    );
    window.dispatchEvent(new Event("order-rating-updated"));
  }

  return (
    <div className="mx-auto max-w-[1000px] space-y-6 px-4 py-6">
      {selectedRatingOrder ? (
        <OrderRatingModal
          key={selectedRatingOrder.id}
          onClose={() => setSelectedRatingOrder(null)}
          onSaved={(rating) => handleRatingSaved(selectedRatingOrder.id, rating)}
          order={selectedRatingOrder}
        />
      ) : null}

      {selectedDetailOrder ? (
        <OrderDetailModal
          onClose={() => setSelectedDetailOrder(null)}
          order={selectedDetailOrder}
          restaurantId={selectedDetailOrder.restaurantId}
        />
      ) : null}

      <section>
        <span className="text-xs text-gray-400">
          <Link href="/client/mi-cuenta">Mi cuenta</Link>
        </span>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Calificación de pedidos
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Calificá los pedidos finalizados que todavía no tienen calificación.
        </p>
      </section>

      <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700">
        {loading
          ? "Cargando pedidos pendientes de calificación..."
          : orders.length === 0
          ? "No tenés pedidos pendientes de calificación."
          : `${orders.length} ${
              orders.length === 1 ? "pedido pendiente" : "pedidos pendientes"
            } de calificación.`}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <OrderRatingSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-16 text-center">
          <HandThumbUpIcon className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">
            No tenés pedidos pendientes de calificación.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-orange-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <h2 className="font-bold text-gray-900">
                      Pedido #{order.id}
                    </h2>
                    <button
                      className="inline-flex shrink-0 items-center rounded-md border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-700 transition-colors hover:border-orange-300 hover:bg-orange-50"
                      onClick={() => setSelectedDetailOrder(order)}
                      type="button"
                    >
                      Ver detalles
                    </button>
                    <button
                      className="inline-flex shrink-0 items-center rounded-md border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-700 transition-colors hover:border-orange-300 hover:bg-orange-50"
                      onClick={() => setSelectedRatingOrder(order)}
                      type="button"
                    >
                      Calificar
                    </button>
                  </div>
                  <div className="mt-0.5 text-sm text-gray-500">
                    <LocalNameWidget localId={order.restaurantId} />
                  </div>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                  Finalizado
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-400">
                  {formatDate(order.creacion)}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400">
                    {itemCount(order)} {itemCount(order) === 1 ? "ítem" : "ítems"}
                  </span>
                  <span className="text-sm font-bold text-orange-700">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>

              {order.urlFactura ? (
                <div className="mt-3">
                  <Link
                    href={order.urlFactura}
                    target="_blank"
                    className="text-xs font-semibold text-orange-700 hover:underline"
                  >
                    Ver factura
                  </Link>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
