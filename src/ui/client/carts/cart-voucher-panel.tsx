"use client";

import type { ClientVoucher } from "@/lib/client/types";
import { formatCartDateTime, formatCartPrice } from "@/ui/client/carts/cart-formatters";

type CartVoucherPanelProps = {
  vouchers: ClientVoucher[];
  appliedVoucher: ClientVoucher | null;
  loading: boolean;
  applyingVoucherId: number | null;
  removingVoucher: boolean;
  error: string | null;
  onApply: (voucher: ClientVoucher) => void;
  onRemove: () => void;
};

function VoucherCard({
  voucher,
  isApplied,
  isDisabled,
  isLoading,
  onApply,
  onRemove,
}: {
  voucher: ClientVoucher;
  isApplied: boolean;
  isDisabled: boolean;
  isLoading: boolean;
  onApply: () => void;
  onRemove: () => void;
}) {
  return (
    <article
      className={`rounded-lg border p-3 flex items-start gap-3 transition-colors ${
        isApplied
          ? "border-orange-400 bg-orange-50"
          : "border-gray-200 bg-white"
      } ${isDisabled && !isApplied ? "opacity-50" : ""}`}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-lg font-extrabold text-orange-700 leading-none">
            {formatCartPrice(voucher.amount)}
          </p>
          {isApplied && (
            <span className="shrink-0 rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Aplicado
            </span>
          )}
        </div>

        <p className="text-xs text-gray-600">
          Aplicable hasta:{" "}
          <span className="font-medium text-gray-800">
            {formatCartDateTime(voucher.expiresAt)}
          </span>
        </p>

        {voucher.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{voucher.description}</p>
        )}

        <p className="text-xs font-mono text-gray-700">Código: {voucher.code}</p>

        <p className="text-[10px] text-gray-400 text-right">
          Voucher creado: {formatCartDateTime(voucher.createdAt)}
        </p>
      </div>

      <div className="shrink-0 self-center">
        {isApplied ? (
          <button
            type="button"
            disabled={isLoading}
            onClick={onRemove}
            className="rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50"
          >
            {isLoading ? "..." : "Quitar"}
          </button>
        ) : (
          <button
            type="button"
            disabled={isDisabled || isLoading}
            onClick={onApply}
            className="rounded-lg bg-orange-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "..." : "Aplicar"}
          </button>
        )}
      </div>
    </article>
  );
}

export default function CartVoucherPanel({
  vouchers,
  appliedVoucher,
  loading,
  applyingVoucherId,
  removingVoucher,
  error,
  onApply,
  onRemove,
}: CartVoucherPanelProps) {
  const hasAppliedVoucher = appliedVoucher != null;
  const visibleVouchers = hasAppliedVoucher
    ? [appliedVoucher, ...vouchers.filter((voucher) => voucher.id !== appliedVoucher.id)]
    : vouchers;

  return (
    <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">
          Vouchers aplicables para este local
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Compensaciones por reclamos aprobados en este restaurante.
        </p>
      </div>

      <div className="p-4">
        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <span className="block h-5 w-5 animate-spin rounded-full border-2 border-orange-200 border-t-orange-700" />
          </div>
        ) : visibleVouchers.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">
            No tenés vouchers disponibles para este local.
          </p>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {visibleVouchers.map((voucher) => {
              const isApplied = appliedVoucher?.id === voucher.id;
              const isDisabled = hasAppliedVoucher && !isApplied;
              const isLoading =
                (applyingVoucherId === voucher.id) || (isApplied && removingVoucher);

              return (
                <VoucherCard
                  key={voucher.id}
                  voucher={voucher}
                  isApplied={isApplied}
                  isDisabled={isDisabled}
                  isLoading={isLoading}
                  onApply={() => onApply(voucher)}
                  onRemove={onRemove}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
