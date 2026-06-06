"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { Order } from "@/lib/client/types";
import {
  getOrderHistory,
  getRestaurantName,
} from "@/services/client/client-service";
import OrderDetailModal from "@/ui/client/orders/order-detail-modal";

type OrderHistoryDetailPageProps = {
  orderId: number;
};

export default function OrderHistoryDetailPage({
  orderId,
}: OrderHistoryDetailPageProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadOrder() {
      setIsLoading(true);
      setError(null);

      try {
        const { orders } = await getOrderHistory({
          orderId,
          page: 0,
          size: 1,
        });
        const selectedOrder = orders[0] ?? null;

        if (!selectedOrder) {
          throw new Error("No se encontro el pedido.");
        }

        const name = await getRestaurantName(selectedOrder.restaurantId).catch(
          () => `Local #${selectedOrder.restaurantId}`,
        );

        if (!ignore) {
          setOrder(selectedOrder);
          setRestaurantName(name);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el pedido.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadOrder();

    return () => {
      ignore = true;
    };
  }, [orderId]);

  function handleClose() {
    router.push("/client/order-history");
  }

  return (
    <main className="min-h-[60vh] px-4 py-10">
      <div className="mx-auto max-w-[760px] rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {isLoading
            ? "Cargando detalle del pedido..."
            : "Detalle del pedido"}
        </p>
        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        ) : null}
      </div>

      {order ? (
        <OrderDetailModal
          onClose={handleClose}
          order={order}
          restaurantName={restaurantName || `Local #${order.restaurantId}`}
        />
      ) : null}
    </main>
  );
}
