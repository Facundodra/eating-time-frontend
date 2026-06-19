"use client";

import { useEffect, useState } from "react";

import type { Order, OrderRating } from "@/lib/client/types";
import { getOrderHistory } from "@/services/client/client-service";
import OrderRatingModal from "@/ui/client/ratings/order-rating-modal";

const RATING_CHECK_INTERVAL_MS = 30_000;
const RECENT_ORDER_LIMIT = 20;
const DISMISSED_ORDER_IDS_KEY = "eating-time:dismissed-rating-prompts";

function getDismissedOrderIds() {
  try {
    const storedValue = sessionStorage.getItem(DISMISSED_ORDER_IDS_KEY);
    const parsedValue: unknown = storedValue ? JSON.parse(storedValue) : [];

    if (!Array.isArray(parsedValue)) return new Set<number>();

    return new Set(
      parsedValue.filter(
        (orderId): orderId is number =>
          typeof orderId === "number" && Number.isInteger(orderId),
      ),
    );
  } catch {
    return new Set<number>();
  }
}

function rememberDismissedOrder(orderId: number) {
  try {
    const dismissedOrderIds = getDismissedOrderIds();
    dismissedOrderIds.add(orderId);
    sessionStorage.setItem(
      DISMISSED_ORDER_IDS_KEY,
      JSON.stringify(Array.from(dismissedOrderIds)),
    );
  } catch {
    // Dismissal still works when browser storage is unavailable.
  }
}

function isPendingRating(order: Order) {
  return (
    order.estado === "FINALIZADO" &&
    !order.hasLocalRating &&
    !order.calificacionLocal
  );
}

export default function ClientOrderRatingPrompt() {
  const [orderToRate, setOrderToRate] = useState<Order | null>(null);

  useEffect(() => {
    let cancelled = false;
    let requestInProgress = false;

    async function checkForFinishedOrder() {
      if (requestInProgress || document.visibilityState === "hidden") return;

      requestInProgress = true;

      try {
        const { orders } = await getOrderHistory({
          page: 0,
          size: RECENT_ORDER_LIMIT,
          ordenarPor: "fecha",
          direccion: "desc",
        });

        if (cancelled) return;

        const dismissedOrderIds = getDismissedOrderIds();
        const nextOrder =
          orders.find(
            (order) =>
              isPendingRating(order) && !dismissedOrderIds.has(order.id),
          ) ?? null;

        setOrderToRate(nextOrder);
      } catch {
        // The manual rating page remains available when this background check fails.
      } finally {
        requestInProgress = false;
      }
    }

    function checkWhenVisible() {
      if (document.visibilityState === "visible") {
        void checkForFinishedOrder();
      }
    }

    void checkForFinishedOrder();
    const intervalId = window.setInterval(
      checkForFinishedOrder,
      RATING_CHECK_INTERVAL_MS,
    );

    document.addEventListener("visibilitychange", checkWhenVisible);
    window.addEventListener("focus", checkForFinishedOrder);
    window.addEventListener("order-rating-updated", checkForFinishedOrder);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", checkWhenVisible);
      window.removeEventListener("focus", checkForFinishedOrder);
      window.removeEventListener("order-rating-updated", checkForFinishedOrder);
    };
  }, []);

  function closePrompt() {
    if (orderToRate) rememberDismissedOrder(orderToRate.id);
    setOrderToRate(null);
  }

  function handleRatingSaved(rating: OrderRating) {
    rememberDismissedOrder(rating.pedidoId);
    setOrderToRate(null);
    window.dispatchEvent(new Event("order-rating-updated"));
  }

  return orderToRate ? (
    <OrderRatingModal
      key={orderToRate.id}
      onClose={closePrompt}
      onSaved={handleRatingSaved}
      order={orderToRate}
    />
  ) : null;
}
