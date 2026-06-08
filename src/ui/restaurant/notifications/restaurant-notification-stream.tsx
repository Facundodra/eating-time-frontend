"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import { RESTAURANT_WORKBENCH_REFRESH_EVENT } from "@/lib/restaurant/notifications";

type RestaurantNotificationType = "PEDIDO_NUEVO" | "PEDIDO_CANCELADO";

type RestaurantSsePayload = {
  tipo?: string;
  pedidoId?: number;
  mensaje?: string;
};

type RestaurantToast = {
  id: string;
  type: RestaurantNotificationType;
  message: string;
};

const TOAST_AUTO_CLOSE_MS = 7000;

const toastStyles: Record<RestaurantNotificationType, string> = {
  PEDIDO_NUEVO:
    "border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-100",
  PEDIDO_CANCELADO:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100",
};

function createToastId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isRestaurantNotificationType(
  type?: string,
): type is RestaurantNotificationType {
  return type === "PEDIDO_NUEVO" || type === "PEDIDO_CANCELADO";
}

function getFallbackMessage(payload: RestaurantSsePayload) {
  if (payload.tipo === "PEDIDO_CANCELADO") {
    return `El pedido #${payload.pedidoId ?? ""} fue cancelado por el cliente.`;
  }

  return `Se confirmó el pago del pedido #${payload.pedidoId ?? ""}.`;
}

export default function RestaurantNotificationStream({
  restaurantId,
}: {
  restaurantId: number;
}) {
  const [toasts, setToasts] = useState<RestaurantToast[]>([]);

  const dismissToast = useCallback((toastId: string) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastId),
    );
  }, []);

  const addToast = useCallback(
    (payload: RestaurantSsePayload) => {
      if (!isRestaurantNotificationType(payload.tipo)) return;

      const id = createToastId();
      const type = payload.tipo;
      const message = payload.mensaje?.trim() || getFallbackMessage(payload);

      setToasts((currentToasts) =>
        [{ id, type, message }, ...currentToasts].slice(0, 4),
      );

      window.dispatchEvent(new Event(RESTAURANT_WORKBENCH_REFRESH_EVENT));
      window.setTimeout(() => dismissToast(id), TOAST_AUTO_CLOSE_MS);
    },
    [dismissToast],
  );

  useEffect(() => {
    const source = new EventSource(
      `/api/backend/api/local/${restaurantId}/notificaciones/stream`,
    );

    source.addEventListener("notificacion", (event) => {
      const messageEvent = event as MessageEvent<string>;

      try {
        addToast(JSON.parse(messageEvent.data) as RestaurantSsePayload);
      } catch {
        console.warn("[SSE] No se pudo leer la notificacion del local.");
      }
    });

    source.onerror = () => {
      console.warn("[SSE] Conexion del local interrumpida, reintentando.");
    };

    return () => source.close();
  }, [addToast, restaurantId]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            "rounded-2xl border p-4 shadow-lg backdrop-blur",
            toastStyles[toast.type],
          )}
          role="status"
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">
                {toast.type === "PEDIDO_NUEVO"
                  ? "Nuevo pedido"
                  : "Pedido cancelado"}
              </p>
              <p className="mt-1 text-sm font-medium opacity-80">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="rounded-full px-2 text-lg leading-6 opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
              aria-label="Cerrar notificacion"
            >
              x
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
