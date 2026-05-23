"use client";

import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo, useRef, useState, useTransition } from "react";

import {
  createDishAction,
  deleteDishAction,
  toggleDishAvailabilityAction,
  updateDishAction,
} from "@/app/restaurant/dishes/actions";
import type { DishStatus, LocalDish, LocalDishesResponse } from "@/lib/local-dish/types";

type DishFilter = "all" | DishStatus;

function StatusBadge({ status }: { status: DishStatus }) {
  return (
    <span
      className={clsx(
        "rounded-full px-3 py-1 text-xs font-extrabold",
        status === "available"
          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
      )}
    >
      {status === "available" ? "Disponible" : "No disponible"}
    </span>
  );
}

function formatPrice(price: number) {
  return `$${price.toLocaleString("es-UY")}`;
}

export default function RestaurantDishesPage({
  initialData,
}: {
  initialData: LocalDishesResponse;
}) {
  const [filter, setFilter] = useState<DishFilter>("all");
  const [dishes, setDishes] = useState(initialData.dishes);
  const [selectedDishId, setSelectedDishId] = useState(
    initialData.dishes[0]?.id ?? "",
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Create form refs
  const createFormRef = useRef<HTMLFormElement>(null);

  // Edit form state
  const [editName, setEditName] = useState(initialData.dishes[0]?.name ?? "");
  const [editPrice, setEditPrice] = useState(
    String(initialData.dishes[0]?.price ?? ""),
  );

  const filteredDishes = useMemo(() => {
    if (filter === "all") return dishes;
    return dishes.filter((dish) => dish.status === filter);
  }, [dishes, filter]);

  const selectedDish =
    dishes.find((dish) => dish.id === selectedDishId) ??
    filteredDishes[0] ??
    null;

  function selectDish(dish: LocalDish) {
    setSelectedDishId(dish.id);
    setEditName(dish.name);
    setEditPrice(String(dish.price));
    setShowCreateForm(false);
    setError(null);
  }

  function handleCreate(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    const price = Number(formData.get("price") ?? 0);

    if (!name || price <= 0) {
      setError("Nombre y precio son obligatorios");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createDishAction(initialData.localId, formData);

      if (result.error) {
        setError(result.error);
      } else {
        createFormRef.current?.reset();
        setShowCreateForm(false);
        // Reload to get fresh data from server
        window.location.reload();
      }
    });
  }

  function handleUpdate() {
    if (!selectedDish) return;

    const price = editPrice ? Number(editPrice) : undefined;
    if (price != null && (isNaN(price) || price <= 0)) {
      setError("El precio debe ser un numero positivo");
      return;
    }

    setError(null);
    const formData = new FormData();
    if (editName.trim()) formData.append("name", editName.trim());
    if (price != null) formData.append("price", String(price));

    const fileInput = document.getElementById(
      "edit-image-input",
    ) as HTMLInputElement | null;
    if (fileInput?.files?.[0]) {
      formData.append("image", fileInput.files[0]);
    }

    startTransition(async () => {
      const result = await updateDishAction(selectedDish.id, formData);

      if (result.error) {
        setError(result.error);
      } else {
        setDishes((current) =>
          current.map((d) =>
            d.id === selectedDish.id
              ? {
                  ...d,
                  name: editName.trim() || d.name,
                  price: price ?? d.price,
                }
              : d,
          ),
        );
        setError(null);
      }
    });
  }

  function handleDelete() {
    if (!selectedDish) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteDishAction(selectedDish.id);

      if (result.error) {
        setError(result.error);
      } else {
        setDishes((current) => current.filter((d) => d.id !== selectedDish.id));
        setSelectedDishId("");
      }
    });
  }

  function handleToggleAvailability() {
    if (!selectedDish) return;

    setError(null);
    startTransition(async () => {
      const result = await toggleDishAvailabilityAction(selectedDish.id);

      if (result.error) {
        setError(result.error);
      } else {
        setDishes((current) =>
          current.map((d) =>
            d.id === selectedDish.id
              ? {
                  ...d,
                  status:
                    d.status === "available" ? "unavailable" : "available",
                }
              : d,
          ),
        );
      }
    });
  }

  return (
    <section className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label htmlFor="dish-status-filter" className="block max-w-[180px]">
          <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
            Estado
          </span>
          <select
            id="dish-status-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value as DishFilter)}
            className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
          >
            <option value="all">Todos</option>
            <option value="available">Disponibles</option>
            <option value="unavailable">No disponibles</option>
          </select>
        </label>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(420px,1fr)]">
        {/* Dish list */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Listado de platos
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Selecciona un plato para ver sus datos, editarlo o eliminarlo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(true);
                setSelectedDishId("");
                setError(null);
              }}
              className="flex h-11 w-fit cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-700"
            >
              <PlusIcon className="h-5 w-5" />
              Nuevo plato
            </button>
          </div>

          <div className="space-y-4 p-3">
            {filteredDishes.length === 0 && (
              <p className="px-4 py-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
                No hay platos para mostrar.
              </p>
            )}
            {filteredDishes.map((dish) => {
              const isSelected =
                dish.id === selectedDish?.id && !showCreateForm;

              return (
                <button
                  type="button"
                  key={dish.id}
                  onClick={() => selectDish(dish)}
                  className={clsx(
                    "grid w-full cursor-pointer gap-4 rounded-2xl border p-4 text-left transition hover:border-orange-200 hover:bg-orange-50/40 md:grid-cols-[96px_minmax(0,1fr)_auto] md:items-start dark:hover:border-orange-500/30 dark:hover:bg-orange-500/10",
                    isSelected
                      ? "border-orange-200 bg-orange-50/40 dark:border-orange-500/30 dark:bg-orange-500/10"
                      : "border-transparent bg-white dark:bg-slate-900",
                  )}
                >
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-orange-50 dark:bg-orange-500/10">
                    {dish.imageUrl ? (
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-black text-orange-600 dark:text-orange-400">
                        {dish.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                      {dish.name}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                      {formatPrice(dish.price)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        Creado: {dish.createdAt}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={dish.status} />
                </button>
              );
            })}
          </div>
        </section>

        {/* Create form panel */}
        {showCreateForm && (
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Nuevo plato
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Completa los datos para dar de alta un nuevo plato.
              </p>
            </div>

            <form
              ref={createFormRef}
              action={handleCreate}
              className="space-y-4 p-5"
            >
              <label className="block">
                <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  Nombre
                </span>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ej: Pizza Muzzarella"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  Precio
                </span>
                <input
                  type="number"
                  name="price"
                  min={1}
                  step="0.01"
                  required
                  placeholder="350"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  Imagen (opcional)
                </span>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 pt-2 text-sm font-medium text-slate-700 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-1 file:text-xs file:font-extrabold file:text-orange-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                />
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setError(null);
                    createFormRef.current?.reset();
                  }}
                  className="h-11 cursor-pointer rounded-xl bg-slate-100 px-5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-11 cursor-pointer rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-700 disabled:opacity-50"
                >
                  {isPending ? "Creando..." : "Crear plato"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Detail / Edit panel */}
        {!showCreateForm && selectedDish && (
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                  Detalle del plato
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Edita los datos o elimina el plato.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-extrabold text-red-500 transition hover:bg-red-100 disabled:opacity-50 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
              >
                <TrashIcon className="h-4 w-4" />
                Eliminar
              </button>
            </div>

            <div className="space-y-4 p-5">
              <label className="block">
                <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  Nombre
                </span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  Precio
                </span>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  Nueva imagen (opcional)
                </span>
                <input
                  id="edit-image-input"
                  type="file"
                  accept="image/*"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 pt-2 text-sm font-medium text-slate-700 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-1 file:text-xs file:font-extrabold file:text-orange-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                />
              </label>

              <div>
                <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  Estado actual
                </span>
                <div className="flex h-11 w-full items-center rounded-xl border border-gray-200 bg-slate-50 px-4 dark:border-slate-800 dark:bg-slate-950">
                  <StatusBadge status={selectedDish.status} />
                </div>
              </div>

              <div>
                <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  Fecha de creacion
                </span>
                <input
                  value={selectedDish.createdAt}
                  readOnly
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-5 py-5 sm:flex-row sm:justify-end dark:border-slate-800">
              <button
                type="button"
                onClick={handleToggleAvailability}
                disabled={isPending}
                className="h-11 cursor-pointer rounded-xl bg-orange-50 px-5 text-sm font-extrabold text-orange-600 transition hover:bg-orange-100 disabled:opacity-50 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
              >
                {isPending
                  ? "Actualizando..."
                  : selectedDish.status === "available"
                    ? "Marcar no disponible"
                    : "Marcar disponible"}
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isPending}
                className="h-11 cursor-pointer rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-700 disabled:opacity-50"
              >
                {isPending ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
