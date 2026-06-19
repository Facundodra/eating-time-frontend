"use client";

import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";

type ClientNotificationType = "PEDIDO_ACEPTADO" | "PEDIDO_RECHAZADO";

type ClientSsePayload = {
  tipo?: string;
  pedidoId?: number;
  mensaje?: string;
};

type ClientBanner = {
  id: string;
  key: string;
  type: ClientNotificationType;
  message: string;
};

const BANNER_AUTO_CLOSE_MS = 6500;

const bannerStyles: Record<ClientNotificationType, string> = {
  PEDIDO_ACEPTADO:
    "border-slate-200 border-l-emerald-500 bg-white/95 text-slate-900 dark:border-slate-700 dark:border-l-emerald-400 dark:bg-slate-900/95 dark:text-slate-100",
  PEDIDO_RECHAZADO:
    "border-slate-200 border-l-rose-400 bg-white/95 text-slate-900 dark:border-slate-700 dark:border-l-rose-400 dark:bg-slate-900/95 dark:text-slate-100",
};

function createBannerId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isClientNotificationType(type?: string): type is ClientNotificationType {
  return type === "PEDIDO_ACEPTADO" || type === "PEDIDO_RECHAZADO";
}

function getFallbackMessage(payload: ClientSsePayload) {
  if (payload.tipo === "PEDIDO_RECHAZADO") {
    return `Tu pedido #${payload.pedidoId ?? ""} fue rechazado.`;
  }

  return `Tu pedido #${payload.pedidoId ?? ""} fue aceptado.`;
}

export default function ClientNotificationStream({
  clientId,
}: {
  clientId: number;
}) {
  const [banners, setBanners] = useState<ClientBanner[]>([]);
  const closeTimers = useRef(new Map<string, number>());

  const dismissBanner = useCallback((bannerId: string) => {
    const timer = closeTimers.current.get(bannerId);
    if (timer != null) window.clearTimeout(timer);
    closeTimers.current.delete(bannerId);
    setBanners((currentBanners) =>
      currentBanners.filter((banner) => banner.id !== bannerId),
    );
  }, []);

  const addBanner = useCallback(
    (payload: ClientSsePayload) => {
      if (!isClientNotificationType(payload.tipo)) return;

      const id = createBannerId();
      const type = payload.tipo;
      const key = `${type}-${payload.pedidoId ?? payload.mensaje ?? "general"}`;
      const message = payload.mensaje?.trim() || getFallbackMessage(payload);

      setBanners((currentBanners) =>
        [{ id, key, type, message }, ...currentBanners.filter((item) => item.key !== key)].slice(0, 3),
      );
      window.dispatchEvent(new Event("pending-orders-updated"));

      const timer = window.setTimeout(
        () => dismissBanner(id),
        BANNER_AUTO_CLOSE_MS,
      );
      closeTimers.current.set(id, timer);
    },
    [dismissBanner],
  );

  useEffect(() => {
    const source = new EventSource(
      `/api/backend/api/clientes/${clientId}/notificaciones/stream`,
    );

    source.addEventListener("notificacion", (event) => {
      const messageEvent = event as MessageEvent<string>;

      try {
        addBanner(JSON.parse(messageEvent.data) as ClientSsePayload);
      } catch {
        console.warn("[SSE] No se pudo leer la notificación del cliente.");
      }
    });

    source.onerror = () => {
      console.warn("[SSE] Conexión del cliente interrumpida, reintentando.");
    };

    return () => source.close();
  }, [addBanner, clientId]);

  useEffect(() => {
    const timers = closeTimers.current;

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  if (banners.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed right-4 top-20 z-[80] flex w-[min(23rem,calc(100vw-2rem))] flex-col gap-3"
    >
      {banners.map((banner) => (
        <div
          key={banner.id}
          className={clsx(
            "rounded-2xl border border-l-4 p-4 shadow-lg shadow-slate-950/10 backdrop-blur dark:shadow-black/25",
            bannerStyles[banner.type],
          )}
          role="status"
        >
          <div className="flex items-start gap-3">
            <span
              className={clsx(
                "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full",
                banner.type === "PEDIDO_ACEPTADO"
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-300",
              )}
            >
              {banner.type === "PEDIDO_ACEPTADO" ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <XMarkIcon className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">
                {banner.type === "PEDIDO_ACEPTADO"
                  ? "Pedido aceptado"
                  : "Pedido rechazado"}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                {banner.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dismissBanner(banner.id)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Cerrar notificación"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
