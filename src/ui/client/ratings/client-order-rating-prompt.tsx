"use client";

import { useEffect, useRef, useState } from "react";

import type { Order, OrderRating } from "@/lib/client/types";
import { getOrderHistory } from "@/services/client/client-service";
import OrderRatingModal from "@/ui/client/ratings/order-rating-modal";

const RECENT_ORDER_LIMIT = 20;
const DISMISSED_ORDER_IDS_KEY = "eating-time:dismissed-rating-prompts";
/** Solo pedidos recientes: evita popups por historial antiguo de prueba. */
const PROMPT_MAX_ORDER_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getDismissedOrderIds() {
  try {
    const storedValue = localStorage.getItem(DISMISSED_ORDER_IDS_KEY);
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
    localStorage.setItem(
      DISMISSED_ORDER_IDS_KEY,
      JSON.stringify(Array.from(dismissedOrderIds)),
    );
  } catch {
    // Dismissal still works when browser storage is unavailable.
  }
}

function isRecentEnoughToPrompt(order: Order) {
  const createdAt = new Date(order.creacion).getTime();
  if (Number.isNaN(createdAt)) return false;
  return Date.now() - createdAt <= PROMPT_MAX_ORDER_AGE_MS;
}

function isPendingRating(order: Order) {
  return (
    order.estado === "FINALIZADO" &&
    !order.hasLocalRating &&
    !order.calificacionLocal &&
    isRecentEnoughToPrompt(order)
  );
}

export default function ClientOrderRatingPrompt() {
  const [orderToRate, setOrderToRate] = useState<Order | null>(null);
  const promptedOrderIdsRef = useRef(new Set<number>());

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
              isPendingRating(order) &&
              !dismissedOrderIds.has(order.id) &&
              !promptedOrderIdsRef.current.has(order.id),
          ) ?? null;

        if (!nextOrder) {
          setOrderToRate(null);
          return;
        }

        promptedOrderIdsRef.current.add(nextOrder.id);
        setOrderToRate(nextOrder);
      } catch {
        // La página de calificaciones sigue disponible si falla este chequeo.
      } finally {
        requestInProgress = false;
      }
    }

    void checkForFinishedOrder();

    function handleRatingUpdated() {
      void checkForFinishedOrder();
    }

    window.addEventListener("order-rating-updated", handleRatingUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("order-rating-updated", handleRatingUpdated);
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
