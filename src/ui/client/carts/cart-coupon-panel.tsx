"use client";

import { useState } from "react";
import { ReceiptPercentIcon } from "@heroicons/react/24/outline";
import type { AppliedCartCoupon } from "@/lib/client/types";
import { formatCartPrice } from "@/ui/client/carts/cart-formatters";

type CartCouponPanelProps = {
  appliedCoupon: AppliedCartCoupon | null;
  applying: boolean;
  removing: boolean;
  error: string | null;
  onApply: (code: string) => void;
  onRemove: () => void;
};

export default function CartCouponPanel({
  appliedCoupon,
  applying,
  removing,
  error,
  onApply,
  onRemove,
}: CartCouponPanelProps) {
  const [couponCode, setCouponCode] = useState("");
  const hasAppliedCoupon = appliedCoupon != null;

  function handleApply() {
    const trimmed = couponCode.trim();
    if (!trimmed) return;
    onApply(trimmed);
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
        <ReceiptPercentIcon className="h-5 w-5 text-orange-600" />
        <h2 className="text-sm font-semibold text-gray-800">Cupón de descuento</h2>
      </div>

      <div className="space-y-3 p-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
        )}

        {hasAppliedCoupon ? (
          <article className="rounded-lg border border-orange-400 bg-orange-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-extrabold text-orange-700 leading-none">
                    {appliedCoupon.percentage}%
                  </p>
                  <span className="rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Aplicado
                  </span>
                </div>
                <p className="text-xs font-mono text-gray-700">
                  Código: {appliedCoupon.code}
                </p>
                <p className="text-xs text-green-700">
                  Descuento: -{formatCartPrice(appliedCoupon.discountAmount)}
                </p>
              </div>
              <button
                type="button"
                disabled={removing}
                onClick={onRemove}
                className="shrink-0 rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50"
              >
                {removing ? "..." : "Quitar"}
              </button>
            </div>
          </article>
        ) : (
          <>
            <label htmlFor="cart-coupon-code" className="block text-xs font-medium text-gray-600">
              Código del cupón
            </label>
            <input
              id="cart-coupon-code"
              type="text"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleApply();
                }
              }}
              placeholder="Ej: VERANO20"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
            <button
              type="button"
              disabled={applying || !couponCode.trim()}
              onClick={handleApply}
              className="w-full rounded-xl bg-orange-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applying ? "Validando..." : "Aplicar cupón"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
