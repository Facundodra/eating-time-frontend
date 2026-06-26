"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

import type { Order } from "@/lib/client/types";
import {
  getOrderHistory,
  getRestaurantName as fetchRestaurantName,
} from "@/services/client/client-service";
import {
  MAX_COMPLAINT_NOTE_LENGTH,
  getOrderClaim,
  submitOrderClaim,
} from "@/services/client/claim-service";
import LoadingButton from "@/ui/shared/buttons/loading-button";

const ELIGIBLE_STATUSES: Order["estado"][] = [
  "RECHAZADO_LOCAL",
  "ACEPTADO_LOCAL",
  "EN_CURSO_LOCAL",
  "EN_CAMINO_LOCAL",
  "FINALIZADO",
];

function formatPrice(price: number) {
  return `$${price.toLocaleString("es-UY")}`;
}

function activeItems(order: Order) {
  return order.items.filter((item) => item.eliminacion == null);
}

export default function ComplaintPage({ pedidoId }: { pedidoId: number }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadOrder() {
      setLoading(true);
      setLoadError(null);

      try {
        const { orders } = await getOrderHistory({
          orderId: pedidoId,
          size: 1,
          includeRatings: false,
        });

        if (ignore) return;

        const matchedOrder = orders[0] ?? null;

        if (!matchedOrder) {
          setLoadError("No encontramos ese pedido en tu historial.");
          setOrder(null);
          return;
        }

        if (!ELIGIBLE_STATUSES.includes(matchedOrder.estado)) {
          setLoadError("Este pedido no admite reclamos.");
          setOrder(null);
          return;
        }

        const existingClaim = await getOrderClaim(pedidoId).catch(() => null);

        if (ignore) return;

        if (existingClaim) {
          setLoadError(
            "Ya existe un reclamo para este pedido. Volvé al historial para verlo.",
          );
          setOrder(null);
          return;
        }

        setOrder(matchedOrder);

        const name =
          matchedOrder.restaurantName ??
          (await fetchRestaurantName(matchedOrder.restaurantId).catch(() => null));

        if (!ignore) {
          setRestaurantName(name ?? `Local #${matchedOrder.restaurantId}`);
        }
      } catch (error) {
        if (!ignore) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "No se pudo cargar la informacion del pedido.",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadOrder();

    return () => {
      ignore = true;
    };
  }, [pedidoId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = description.trim();

    if (!trimmed) {
      setSubmitError("Contanos que anduvo mal para continuar.");
      return;
    }

    if (trimmed.length > MAX_COMPLAINT_NOTE_LENGTH) {
      setSubmitError(
        `El texto no puede superar los ${MAX_COMPLAINT_NOTE_LENGTH} caracteres.`,
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitOrderClaim(pedidoId, trimmed);
      window.dispatchEvent(new Event("client-claims-updated"));
      router.push("/client/order-history?reclamoEnviado=1");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No se pudo enviar el reclamo. Intentalo nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const textareaClasses =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-orange-400 dark:focus:ring-orange-500/20";

  if (loading) {
    return (
      <div className="mx-auto max-w-[760px] space-y-4 px-4 py-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-slate-800" />
        <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-900" />
      </div>
    );
  }

  if (loadError || !order) {
    return (
      <div className="mx-auto max-w-[760px] px-4 py-6">
        <Link
          className="inline-flex items-center gap-1 text-sm font-semibold text-orange-700 hover:text-orange-800 dark:text-orange-300"
          href="/client/order-history"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Volver al historial
        </Link>
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
          {loadError ?? "No se pudo cargar el pedido."}
        </p>
      </div>
    );
  }

  const items = activeItems(order);

  return (
    <div className="mx-auto max-w-[760px] space-y-6 px-4 py-6">
      <Link
        className="inline-flex items-center gap-1 text-sm font-semibold text-orange-700 transition-colors hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200"
        href="/client/order-history"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Volver al historial
      </Link>

      <section>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          ¿Algo anduvo mal con tu pedido?
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Revisá los datos del pedido y contanos qué pasó.
        </p>
      </section>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoField label="Pedido" value={`#${order.id}`} />
          <InfoField label="Local" value={restaurantName ?? "—"} />
          <InfoField label="Total" value={formatPrice(order.total)} highlight />
          <InfoField
            label="Direccion"
            value={order.direccion?.trim() || "Sin direccion registrada"}
          />
        </div>

        <div>
          <p className="text-xs font-bold uppercase text-slate-400">Platos</p>
          {items.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No hay platos para mostrar.</p>
          ) : (
            <ul className="mt-2 divide-y divide-gray-100 dark:divide-slate-800">
              {items.map((item) => (
                <li
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                  key={item.id}
                >
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {item.nombre ?? `Plato #${item.platoId}`}
                  </span>
                  <span className="shrink-0 text-slate-500 dark:text-slate-400">
                    x{item.cantidad} · {formatPrice(item.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {order.indicaciones?.trim() ? (
          <InfoField
            label="Notas para el local"
            value={order.indicaciones.trim()}
          />
        ) : null}
      </div>

      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-200">
            Contanos tu experiencia y si entendés que el restaurante te debe una
            compensación por el problema (reembolso o voucher):
          </span>
          <textarea
            className={textareaClasses}
            maxLength={MAX_COMPLAINT_NOTE_LENGTH}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ej: El pedido llegó frío y faltaba un plato..."
            required
            rows={6}
            value={description}
          />
          <span className="mt-1 block text-right text-xs text-gray-400 dark:text-slate-500">
            {description.length}/{MAX_COMPLAINT_NOTE_LENGTH}
          </span>
        </label>

        {submitError ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
            {submitError}
          </p>
        ) : null}

        <LoadingButton
          className="w-full rounded-xl bg-orange-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-800 disabled:opacity-60 dark:bg-orange-600 dark:hover:bg-orange-500"
          isLoading={isSubmitting}
          loadingText="Enviando reclamo..."
          type="submit"
        >
          Enviar reclamo
        </LoadingButton>
      </form>
    </div>
  );
}

function InfoField({
  highlight = false,
  label,
  value,
}: {
  highlight?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <span className="block text-xs font-bold uppercase text-slate-400">
        {label}
      </span>
      <p
        className={`mt-2 text-sm font-semibold ${
          highlight
            ? "text-orange-700 dark:text-orange-300"
            : "text-slate-800 dark:text-slate-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
