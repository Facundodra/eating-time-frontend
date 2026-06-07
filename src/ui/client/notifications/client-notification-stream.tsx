"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

type ClientNotificationType = "PEDIDO_ACEPTADO" | "PEDIDO_RECHAZADO";

type ClientSsePayload = {
  tipo?: string;
  pedidoId?: number;
  mensaje?: string;
};

type ClientBanner = {
  id: string;
  type: ClientNotificationType;
  message: string;
};

const bannerStyles: Record<ClientNotificationType, string> = {
  PEDIDO_ACEPTADO:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
  PEDIDO_RECHAZADO:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100",
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

  const dismissBanner = useCallback((bannerId: string) => {
    setBanners((currentBanners) =>
      currentBanners.filter((banner) => banner.id !== bannerId),
    );
  }, []);

  const addBanner = useCallback((payload: ClientSsePayload) => {
    if (!isClientNotificationType(payload.tipo)) return;

    const type = payload.tipo;
    const message = payload.mensaje?.trim() || getFallbackMessage(payload);
    setBanners((currentBanners) =>
      [
        {
          id: createBannerId(),
          type,
          message,
        },
        ...currentBanners,
      ].slice(0, 4),
    );
  }, []);

  useEffect(() => {
    const source = new EventSource(
      `/api/backend/api/clientes/${clientId}/notificaciones/stream`,
    );

    source.addEventListener("notificacion", (event) => {
      const messageEvent = event as MessageEvent<string>;

      try {
        addBanner(JSON.parse(messageEvent.data) as ClientSsePayload);
      } catch {
        console.warn("[SSE] No se pudo leer la notificacion del cliente.");
      }
    });

    source.onerror = () => {
      console.warn("[SSE] Conexion del cliente interrumpida, reintentando.");
    };

    return () => source.close();
  }, [addBanner, clientId]);

  if (banners.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      {banners.map((banner) => (
        <div
          key={banner.id}
          className={clsx(
            "rounded-2xl border p-4 shadow-lg backdrop-blur",
            bannerStyles[banner.type],
          )}
          role="status"
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">
                {banner.type === "PEDIDO_ACEPTADO"
                  ? "Pedido aceptado"
                  : "Pedido rechazado"}
              </p>
              <p className="mt-1 text-sm font-medium opacity-80">
                {banner.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dismissBanner(banner.id)}
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
