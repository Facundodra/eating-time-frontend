"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo, useState } from "react";

import type {
  DiscountStatus,
  LocalDiscount,
  LocalDiscountsResponse,
} from "@/lib/local-discount/types";

type DiscountFilter = "all" | DiscountStatus;

function getDiscountTitle(discount: LocalDiscount) {
  return `Descuento en ${discount.dishes.length} ${
    discount.dishes.length === 1 ? "plato" : "platos"
  }`;
}

function getDishSummary(discount: LocalDiscount) {
  return discount.dishes.map((dish) => dish.name).join(", ");
}

function StatusBadge({ status }: { status: DiscountStatus }) {
  return (
    <span
      className={clsx(
        "rounded-full px-3 py-1 text-xs font-extrabold",
        status === "active"
          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
      )}
    >
      {status === "active" ? "Activo" : "Inactivo"}
    </span>
  );
}

export default function RestaurantDiscountsPage({
  initialData,
}: {
  initialData: LocalDiscountsResponse;
}) {
  const [filter, setFilter] = useState<DiscountFilter>("all");
  const [discounts, setDiscounts] = useState(initialData.discounts);
  const [selectedDiscountId, setSelectedDiscountId] = useState(
    initialData.discounts[0]?.id ?? "",
  );
  const [selectedDishId, setSelectedDishId] = useState(
    initialData.availableDishes[0]?.id ?? "",
  );

  const filteredDiscounts = useMemo(() => {
    if (filter === "all") {
      return discounts;
    }

    return discounts.filter((discount) => discount.status === filter);
  }, [discounts, filter]);

  const selectedDiscount =
    discounts.find((discount) => discount.id === selectedDiscountId) ??
    filteredDiscounts[0] ??
    discounts[0];

  function updateSelectedDiscount(updates: Partial<LocalDiscount>) {
    if (!selectedDiscount) {
      return;
    }

    setDiscounts((currentDiscounts) =>
      currentDiscounts.map((discount) =>
        discount.id === selectedDiscount.id
          ? { ...discount, ...updates }
          : discount,
      ),
    );
  }

  function addDishToSelectedDiscount() {
    if (!selectedDiscount) {
      return;
    }

    const dish = initialData.availableDishes.find(
      (availableDish) => availableDish.id === selectedDishId,
    );

    if (
      !dish ||
      selectedDiscount.dishes.some((selectedDish) => selectedDish.id === dish.id)
    ) {
      return;
    }

    updateSelectedDiscount({ dishes: [...selectedDiscount.dishes, dish] });
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label htmlFor="discount-status-filter" className="block max-w-[180px]">
          <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
            Estado
          </span>
          <select
            id="discount-status-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value as DiscountFilter)}
            className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </label>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(420px,1fr)]">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Listado de descuentos
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Selecciona un descuento para ver sus datos o darlo de baja.
              </p>
            </div>
            <button
              type="button"
              className="flex h-11 w-fit cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-700"
            >
              <PlusIcon className="h-5 w-5" />
              Nuevo descuento
            </button>
          </div>

          <div className="space-y-4 p-3">
            {filteredDiscounts.map((discount) => {
              const isSelected = discount.id === selectedDiscount?.id;

              return (
                <button
                  type="button"
                  key={discount.id}
                  onClick={() => setSelectedDiscountId(discount.id)}
                  className={clsx(
                    "grid w-full cursor-pointer gap-4 rounded-2xl border p-4 text-left transition hover:border-orange-200 hover:bg-orange-50/40 md:grid-cols-[96px_minmax(0,1fr)_auto] md:items-start dark:hover:border-orange-500/30 dark:hover:bg-orange-500/10",
                    isSelected
                      ? "border-orange-200 bg-orange-50/40 dark:border-orange-500/30 dark:bg-orange-500/10"
                      : "border-transparent bg-white dark:bg-slate-900",
                  )}
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-50 text-3xl font-black text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                    {discount.percentage}%
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                      {getDiscountTitle(discount)}
                    </h3>
                    <p className="mt-2 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-slate-500 dark:text-slate-400">
                      {getDishSummary(discount)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        Creado: {discount.createdAt}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        Vence: {discount.expiresAt}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={discount.status} />
                </button>
              );
            })}
          </div>
        </section>

        {selectedDiscount && (
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                  Detalle del descuento
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Alta y baja de descuentos asociados a platos.
                </p>
              </div>
              <button
                type="button"
                className="h-10 cursor-pointer rounded-xl bg-red-50 px-4 text-sm font-extrabold text-red-500 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
              >
                Eliminar
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Porcentaje
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={selectedDiscount.percentage}
                    onChange={(event) =>
                      updateSelectedDiscount({
                        percentage: Number(event.target.value),
                      })
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Estado
                  </span>
                  <div className="flex h-11 w-full items-center rounded-xl border border-gray-200 bg-slate-50 px-4 dark:border-slate-800 dark:bg-slate-950">
                    <StatusBadge status={selectedDiscount.status} />
                  </div>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Fecha de creacion
                  </span>
                  <input
                    value={selectedDiscount.createdAt}
                    readOnly
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Fecha de vencimiento
                  </span>
                  <input
                    value={selectedDiscount.expiresAt}
                    onChange={(event) =>
                      updateSelectedDiscount({ expiresAt: event.target.value })
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                  />
                </label>
              </div>

              <div>
                <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  Platos asociados
                </span>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <select
                    value={selectedDishId}
                    onChange={(event) => setSelectedDishId(event.target.value)}
                    className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                  >
                    {initialData.availableDishes.map((dish) => (
                      <option key={dish.id} value={dish.id}>
                        {dish.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addDishToSelectedDiscount}
                    className="h-11 cursor-pointer rounded-xl bg-orange-50 px-5 text-sm font-extrabold text-orange-600 transition hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
                  >
                    Agregar plato
                  </button>
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800">
                  {selectedDiscount.dishes.map((dish) => (
                    <div
                      key={dish.id}
                      className="border-b border-gray-100 px-4 py-4 text-sm font-extrabold text-slate-800 last:border-b-0 dark:border-slate-800 dark:text-slate-100"
                    >
                      {dish.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-5 py-5 sm:flex-row sm:justify-end dark:border-slate-800">
              <button
                type="button"
                onClick={() => updateSelectedDiscount({ status: "inactive" })}
                className="h-11 cursor-pointer rounded-xl bg-orange-50 px-5 text-sm font-extrabold text-orange-600 transition hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
              >
                Marcar inactivo
              </button>
              <button
                type="button"
                className="h-11 cursor-pointer rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-700"
              >
                Guardar cambios
              </button>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
