"use client";

import { PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";

import type {
  DiscountStatus,
  RestaurantDiscount,
  RestaurantDiscountsResponse,
} from "@/lib/restaurant/discount/types";

type DiscountFilter = "all" | DiscountStatus;

function getDiscountTitle(discount: RestaurantDiscount) {
  return `Descuento en ${discount.dishes.length} ${
    discount.dishes.length === 1 ? "plato" : "platos"
  }`;
}

function getDishSummary(discount: RestaurantDiscount) {
  return discount.dishes.map((dish) => dish.name).join(", ");
}

function areDishesEqual(
  currentDishes: RestaurantDiscount["dishes"],
  initialDishes: RestaurantDiscount["dishes"],
) {
  if (currentDishes.length !== initialDishes.length) {
    return false;
  }

  const currentIds = currentDishes.map((dish) => dish.id).sort();
  const initialIds = initialDishes.map((dish) => dish.id).sort();

  return currentIds.every((id, index) => id === initialIds[index]);
}

function filterDiscounts(
  discounts: RestaurantDiscount[],
  filter: DiscountFilter,
) {
  if (filter === "all") {
    return discounts;
  }

  return discounts.filter((discount) => discount.status === filter);
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
  initialData: RestaurantDiscountsResponse;
}) {
  const initialSelectedDiscount = initialData.discounts[0] ?? null;
  const [filter, setFilter] = useState<DiscountFilter>("all");
  const [discounts, setDiscounts] = useState(initialData.discounts);
  const [savedDiscounts, setSavedDiscounts] = useState(initialData.discounts);
  const [selectedDiscountId, setSelectedDiscountId] = useState(
    initialSelectedDiscount?.id ?? "",
  );
  const [selectedDishId, setSelectedDishId] = useState(
    initialData.availableDishes[0]?.id ?? "",
  );
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!formError) {
      return;
    }

    const timeoutId = window.setTimeout(() => setFormError(null), 5000);

    return () => window.clearTimeout(timeoutId);
  }, [formError]);

  const filteredDiscounts = useMemo(() => {
    return filterDiscounts(discounts, filter);
  }, [discounts, filter]);

  const selectedDiscount =
    filteredDiscounts.find((discount) => discount.id === selectedDiscountId) ??
    filteredDiscounts[0] ??
    null;
  const savedSelectedDiscount = savedDiscounts.find(
    (discount) => discount.id === selectedDiscount?.id,
  );
  const hasSelectedDiscountChanges =
    Boolean(selectedDiscount && savedSelectedDiscount) &&
    (selectedDiscount.percentage !== savedSelectedDiscount?.percentage ||
      selectedDiscount.status !== savedSelectedDiscount?.status ||
      selectedDiscount.expiresAt !== savedSelectedDiscount?.expiresAt ||
      !areDishesEqual(
        selectedDiscount.dishes,
        savedSelectedDiscount?.dishes ?? [],
      ));

  function updateSelectedDiscount(updates: Partial<RestaurantDiscount>) {
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

  function selectDiscount(discountId: string) {
    setSelectedDiscountId(discountId);
    setSelectedDishId(initialData.availableDishes[0]?.id ?? "");
    setIsAddingDish(false);
    setIsSavingChanges(false);
    setFormError(null);
  }

  function handleFilterChange(nextFilter: DiscountFilter) {
    const nextFilteredDiscounts = filterDiscounts(discounts, nextFilter);
    const selectedDiscountIsVisible = nextFilteredDiscounts.some(
      (discount) => discount.id === selectedDiscountId,
    );

    setFilter(nextFilter);

    if (selectedDiscountIsVisible) {
      return;
    }

    const nextDiscount = nextFilteredDiscounts[0] ?? null;
    setSelectedDiscountId(nextDiscount?.id ?? "");
    setSelectedDishId(initialData.availableDishes[0]?.id ?? "");
    setIsAddingDish(false);
    setIsSavingChanges(false);
    setFormError(null);
  }

  function addDishToSelectedDiscount() {
    if (!selectedDiscount) {
      setFormError("Selecciona un descuento para agregar platos.");
      return;
    }

    const dish = initialData.availableDishes.find(
      (availableDish) => availableDish.id === selectedDishId,
    );

    if (!dish) {
      setFormError("Selecciona un plato valido.");
      return;
    }

    if (selectedDiscount.dishes.some((selectedDish) => selectedDish.id === dish.id)) {
      setFormError("Ese plato ya esta asociado al descuento.");
      return;
    }

    setFormError(null);
    setIsAddingDish(true);
    updateSelectedDiscount({ dishes: [...selectedDiscount.dishes, dish] });
    window.setTimeout(() => setIsAddingDish(false), 300);
  }

  function removeDishFromSelectedDiscount(dishId: string) {
    if (!selectedDiscount) {
      return;
    }

    setFormError(null);
    updateSelectedDiscount({
      dishes: selectedDiscount.dishes.filter((dish) => dish.id !== dishId),
    });
  }

  function handleCancelChanges() {
    if (!savedSelectedDiscount) {
      return;
    }

    setDiscounts((currentDiscounts) =>
      currentDiscounts.map((discount) =>
        discount.id === savedSelectedDiscount.id
          ? savedSelectedDiscount
          : discount,
      ),
    );
    setSelectedDishId(initialData.availableDishes[0]?.id ?? "");
    setIsAddingDish(false);
    setIsSavingChanges(false);
    setFormError(null);
  }

  function handleSaveChanges() {
    if (!selectedDiscount) {
      setFormError("Selecciona un descuento para guardar cambios.");
      return;
    }

    if (
      !Number.isFinite(selectedDiscount.percentage) ||
      selectedDiscount.percentage < 1 ||
      selectedDiscount.percentage > 100
    ) {
      setFormError("El porcentaje debe estar entre 1 y 100.");
      return;
    }

    if (!selectedDiscount.expiresAt.trim()) {
      setFormError("La fecha de vencimiento es obligatoria.");
      return;
    }

    if (selectedDiscount.dishes.length === 0) {
      setFormError("El descuento debe tener al menos un plato asociado.");
      return;
    }

    try {
      setIsSavingChanges(true);
      setSavedDiscounts((currentDiscounts) =>
        currentDiscounts.map((discount) =>
          discount.id === selectedDiscount.id ? selectedDiscount : discount,
        ),
      );
      setIsAddingDish(false);
      setFormError(null);
    } catch {
      setFormError("No se pudieron guardar los cambios. Intentalo nuevamente.");
    } finally {
      setIsSavingChanges(false);
    }
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
            onChange={(event) =>
              handleFilterChange(event.target.value as DiscountFilter)
            }
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
                  onClick={() => selectDiscount(discount.id)}
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
                <div>
                  <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Fecha de creacion
                  </span>
                  <div className="flex h-11 w-full items-center rounded-xl border border-gray-200 bg-slate-50 px-4 text-sm font-extrabold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                    {selectedDiscount.createdAt}
                  </div>
                </div>

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
                    disabled={isAddingDish}
                    className="h-11 cursor-pointer rounded-xl bg-orange-50 px-5 text-sm font-extrabold text-orange-600 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
                  >
                    {isAddingDish ? "Agregando..." : "Agregar plato"}
                  </button>
                </div>

                {formError && (
                  <div className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    <p>{formError}</p>
                    <button
                      type="button"
                      onClick={() => setFormError(null)}
                      aria-label="Cerrar error"
                      className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg text-red-500 transition hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/20"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800">
                  {selectedDiscount.dishes.map((dish) => (
                    <div
                      key={dish.id}
                      className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 text-sm font-extrabold text-slate-800 last:border-b-0 dark:border-slate-800 dark:text-slate-100"
                    >
                      <span className="min-w-0 truncate">{dish.name}</span>
                      <button
                        type="button"
                        onClick={() => removeDishFromSelectedDiscount(dish.id)}
                        aria-label={`Quitar ${dish.name}`}
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-5 py-5 sm:flex-row sm:justify-end dark:border-slate-800">
              {hasSelectedDiscountChanges && (
                <button
                  type="button"
                  onClick={handleCancelChanges}
                  className="h-11 cursor-pointer rounded-xl bg-slate-100 px-5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={() => updateSelectedDiscount({ status: "inactive" })}
                className="h-11 cursor-pointer rounded-xl bg-orange-50 px-5 text-sm font-extrabold text-orange-600 transition hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
              >
                Marcar inactivo
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={isSavingChanges}
                className="h-11 cursor-pointer rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingChanges ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
