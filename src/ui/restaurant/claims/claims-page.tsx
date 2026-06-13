"use client";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useAsyncData } from "@/hooks/shared/use-async-data";
import type {
  ClaimStatus,
  RestaurantClaim,
  RestaurantClaimsResponse,
} from "@/lib/restaurant/claim/types";
import { getRestaurantClaims } from "@/services/restaurant/claim-service";
import { getCurrentSession } from "@/services/shared/auth-service";
import LoadingIndicator from "@/ui/shared/feedback/loading-indicator";
import PanelError from "@/ui/shared/feedback/panel-error";

type ClaimFilter = "all" | ClaimStatus;

const statusLabels: Record<ClaimStatus, string> = {
  pending: "Pendiente",
  resolved: "Aprobado",
  rejected: "Rechazado",
};

const statusColors: Record<ClaimStatus, string> = {
  pending:
    "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  resolved:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  rejected: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
};

function StatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span
      className={clsx(
        "w-fit rounded-full px-3 py-1 text-xs font-extrabold",
        statusColors[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

function filterClaims(claims: RestaurantClaim[], filter: ClaimFilter) {
  if (filter === "all") {
    return claims;
  }

  return claims.filter((claim) => claim.status === filter);
}

function formatDateTimeLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}/${month}/${day} ${hour}:${minute}`;
}

function formatPrice(value: number) {
  return `$${value.toLocaleString("es-UY")}`;
}

function ClaimMobileCard({ claim }: { claim: RestaurantClaim }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-orange-600 dark:text-orange-400">
            Pedido #{claim.orderId}
          </p>
          <h3 className="mt-2 truncate text-base font-extrabold text-slate-950 dark:text-white">
            {claim.reason}
          </h3>
        </div>
        <StatusBadge status={claim.status} />
      </div>

      <p className="mt-3 line-clamp-2 text-sm font-medium text-slate-500 dark:text-slate-400">
        {claim.detail}
      </p>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <span className="block text-xs font-black uppercase text-slate-400 dark:text-slate-500">
            Cliente
          </span>
          <span className="mt-1 block truncate font-extrabold text-slate-800 dark:text-slate-100">
            {claim.customerName}
          </span>
        </div>
        <div>
          <span className="block text-xs font-black uppercase text-slate-400 dark:text-slate-500">
            Creado
          </span>
          <span className="mt-1 block font-extrabold text-slate-800 dark:text-slate-100">
            {formatDateTimeLabel(claim.createdAt)}
          </span>
        </div>
        <div>
          <span className="block text-xs font-black uppercase text-slate-400 dark:text-slate-500">
            Monto
          </span>
          <span className="mt-1 block font-extrabold text-slate-800 dark:text-slate-100">
            {formatPrice(claim.amount)}
          </span>
        </div>
      </div>

      <Link
        href={`/restaurant/claims/${claim.id}`}
        className="mt-4 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-extrabold text-white transition hover:bg-orange-700"
      >
        Ver reclamo
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </article>
  );
}

async function loadRestaurantClaims(): Promise<RestaurantClaimsResponse> {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error("No se encontro una sesion activa.");
  }

  return getRestaurantClaims(String(session.idTipoUsuario));
}

export default function RestaurantClaimsPage() {
  const [claims, setClaims] = useState<RestaurantClaim[]>([]);
  const [filter, setFilter] = useState<ClaimFilter>("all");
  const {
    data: loadedData,
    error: loadError,
    isLoading,
    reload,
  } = useAsyncData(loadRestaurantClaims, {
    onSuccess: (data) => setClaims(data.claims),
  });

  const filteredClaims = useMemo(() => {
    return filterClaims(claims, filter);
  }, [claims, filter]);

  const isDataReady = Boolean(loadedData) && !isLoading && !loadError;
  const loadErrorMessage =
    loadError?.message ?? "No se pudieron cargar los reclamos.";

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label htmlFor="claim-status-filter" className="block max-w-[200px]">
          <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
            Estado
          </span>
          <select
            id="claim-status-filter"
            value={filter}
            disabled={!isDataReady}
            onChange={(event) =>
              setFilter(event.target.value as ClaimFilter)
            }
            className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="resolved">Aprobados</option>
            <option value="rejected">Rechazados</option>
          </select>
        </label>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
            Reclamos recibidos
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Revisa los reclamos y abre el detalle para ver el pedido asociado.
          </p>
        </div>

        <div className="p-3">
          {isLoading ? (
            <div className="py-8">
              <LoadingIndicator label="Cargando reclamos..." />
            </div>
          ) : loadError ? (
            <PanelError message={loadErrorMessage} onRetry={reload} />
          ) : filteredClaims.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
              No hay reclamos para mostrar.
            </p>
          ) : null}

          {isDataReady && filteredClaims.length > 0 ? (
            <>
              <div className="grid gap-3 lg:hidden">
                {filteredClaims.map((claim) => (
                  <ClaimMobileCard key={claim.id} claim={claim} />
                ))}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <div className="min-w-[920px] overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800">
                <div className="grid grid-cols-[110px_minmax(170px,1fr)_minmax(220px,1.3fr)_150px_130px_150px] items-center gap-4 border-b border-gray-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                  <span>Pedido</span>
                  <span>Cliente</span>
                  <span>Motivo</span>
                  <span>Estado</span>
                  <span>Monto</span>
                  <span>Acciones</span>
                </div>

                {filteredClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="grid grid-cols-[110px_minmax(170px,1fr)_minmax(220px,1.3fr)_150px_130px_150px] items-center gap-4 border-b border-gray-100 px-4 py-4 text-sm last:border-b-0 dark:border-slate-800"
                  >
                    <div className="font-black text-orange-600 dark:text-orange-400">
                      #{claim.orderId}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-extrabold text-slate-900 dark:text-white">
                        {claim.customerName}
                      </p>
                      <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                        {formatDateTimeLabel(claim.createdAt)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-extrabold text-slate-900 dark:text-white">
                        {claim.reason}
                      </p>
                      <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                        {claim.detail}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <StatusBadge status={claim.status} />
                    </div>
                    <div className="font-extrabold text-slate-700 dark:text-slate-200">
                      {formatPrice(claim.amount)}
                    </div>
                    <Link
                      href={`/restaurant/claims/${claim.id}`}
                      className="flex h-10 w-fit cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-extrabold text-white transition hover:bg-orange-700"
                    >
                      Ver reclamo
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </section>
  );
}
