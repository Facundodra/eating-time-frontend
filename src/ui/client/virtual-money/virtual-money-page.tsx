"use client";

import {
  ArrowPathIcon,
  BanknotesIcon,
  ChevronLeftIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ClientVoucher } from "@/lib/client/types";
import {
  getClientVirtualMoney,
  type ClientVirtualMoney,
} from "@/services/client/virtual-money-service";

function formatDate(value: string | null | undefined) {
  if (!value) return "Sin vencimiento";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPrice(value: number | null | undefined) {
  if (value == null) return "Monto no disponible";
  return `$${value.toLocaleString("es-UY")}`;
}

type VoucherDisplayStatus = "available" | "expired" | "used";

function getVoucherStatus(status: string | null | undefined): {
  key: VoucherDisplayStatus;
  label: string;
} {
  const normalized = status?.trim().toLowerCase();

  if (!normalized) return { key: "available", label: "Disponible" };
  if (["activo", "activa", "active", "disponible", "vigente"].includes(normalized)) {
    return { key: "available", label: "Disponible" };
  }
  if (["usado", "usada", "used", "canjeado", "canjeada"].includes(normalized)) {
    return { key: "used", label: "Usado" };
  }
  if (["aplicado", "aplicada", "applied"].includes(normalized)) {
    return { key: "used", label: "Aplicado" };
  }
  if (["vencido", "vencida", "expired"].includes(normalized)) {
    return { key: "expired", label: "Vencido" };
  }

  return { key: "available", label: status ?? "Disponible" };
}

const statusClasses: Record<VoucherDisplayStatus, string> = {
  available:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  expired:
    "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  used: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
};

function getTimestamp(value: string | null | undefined) {
  if (!value) return 0;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getRestaurantLabel(voucher: ClientVoucher) {
  return voucher.restaurantName?.trim() || "Local no informado";
}

function groupVouchersByRestaurant(vouchers: ClientVoucher[]) {
  const groups = new Map<string, ClientVoucher[]>();

  vouchers.forEach((voucher) => {
    const restaurantName = getRestaurantLabel(voucher);
    groups.set(restaurantName, [...(groups.get(restaurantName) ?? []), voucher]);
  });

  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right, "es-UY"))
    .map(([restaurantName, groupVouchers]) => ({
      restaurantName,
      vouchers: [...groupVouchers].sort(
        (left, right) =>
          getTimestamp(right.createdAt) - getTimestamp(left.createdAt) ||
          left.code.localeCompare(right.code, "es-UY"),
      ),
    }));
}

function MoneyCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="h-4 w-28 rounded bg-gray-200 dark:bg-slate-700" />
          <div className="h-3 w-44 rounded bg-gray-100 dark:bg-slate-800" />
        </div>
        <div className="h-9 w-20 rounded bg-gray-100 dark:bg-slate-800" />
      </div>
      <div className="mt-5 h-3 w-36 rounded bg-gray-100 dark:bg-slate-800" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center dark:border-slate-800 dark:bg-slate-900">
      <TicketIcon className="mx-auto h-9 w-9 text-gray-300 dark:text-slate-600" />
      <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
        Todavía no tenés códigos de reembolso disponibles.
      </p>
    </div>
  );
}

function VoucherCard({ voucher }: { voucher: ClientVoucher }) {
  const status = getVoucherStatus(voucher.status);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">
            Código de reembolso
          </p>
          <h2 className="mt-2 truncate text-lg font-black text-slate-950 dark:text-white">
            {voucher.code}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {voucher.description}
          </p>
        </div>
        <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusClasses[status.key]}`}>
          {status.label}
        </span>
      </div>

      <div className="mt-5 grid gap-3 border-t border-gray-100 pt-4 text-sm dark:border-slate-800">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500 dark:text-slate-400">Monto</span>
          <span className="font-black text-orange-700 dark:text-orange-300">
            {formatPrice(voucher.amount)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500 dark:text-slate-400">Vencimiento</span>
          <span className="font-bold text-slate-800 dark:text-slate-100">
            {formatDate(voucher.expiresAt)}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function ClientVirtualMoneyPage() {
  const [data, setData] = useState<ClientVirtualMoney | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const voucherGroups = useMemo(
    () => groupVouchersByRestaurant(data?.vouchers ?? []),
    [data?.vouchers],
  );
  const availableVouchers = useMemo(
    () =>
      (data?.vouchers ?? []).filter(
        (voucher) => getVoucherStatus(voucher.status).key === "available",
      ),
    [data?.vouchers],
  );
  const availableBalance = useMemo(
    () =>
      availableVouchers.reduce(
        (total, voucher) => total + (voucher.amount ?? 0),
        0,
      ),
    [availableVouchers],
  );

  const loadWallet = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setData(await getClientVirtualMoney());
    } catch (err) {
      setData(null);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar tus códigos de reembolso.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  return (
    <div className="space-y-6">
      <Link
        href="/client/mi-cuenta"
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 transition hover:text-orange-700 dark:text-slate-400 dark:hover:text-orange-300"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Volver a mi cuenta
      </Link>

      <section>
        <h1 className="text-2xl font-black text-slate-950 dark:text-white">
          Mi billetera
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Códigos de reembolso agrupados por local.
        </p>
      </section>

      {error ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100">
              No pudimos cargar tu billetera
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadWallet()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-black text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300">
                  <BanknotesIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    Saldo disponible
                  </p>
                  <p className="text-2xl font-black text-slate-950 dark:text-white">
                    {loading ? "..." : formatPrice(availableBalance)}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <TicketIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    Códigos disponibles
                  </p>
                  <p className="text-2xl font-black text-slate-950 dark:text-white">
                    {loading ? "..." : availableVouchers.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5 text-orange-700 dark:text-orange-300" />
              <h2 className="text-lg font-black text-slate-950 dark:text-white">
                Tus reembolsos
              </h2>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <MoneyCardSkeleton key={index} />
                ))}
              </div>
            ) : voucherGroups.length > 0 ? (
              <div className="space-y-6">
                {voucherGroups.map((group) => (
                  <section key={group.restaurantName} className="space-y-3">
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                      {group.restaurantName}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {group.vouchers.map((voucher) => (
                        <VoucherCard key={voucher.id} voucher={voucher} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </section>
        </>
      )}
    </div>
  );
}
