"use client";

import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";

import {
  createDishAction,
  deleteDishAction,
  toggleDishAvailabilityAction,
  updateDishAction,
} from "@/app/restaurant/dishes/actions";
import { useAsyncData } from "@/hooks/shared/use-async-data";
import type {
  DishCategory,
  DishStatus,
  RestaurantDish,
  RestaurantDishesResponse,
} from "@/lib/restaurant/dish/types";
import { getDishCategories, getRestaurantDishes } from "@/services/restaurant/dish-service";
import { getCurrentSession } from "@/services/shared/auth-service";
import LoadingIndicator from "@/ui/shared/feedback/loading-indicator";
import PanelError from "@/ui/shared/feedback/panel-error";

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

function formatDateTimeLabel(dateStr: string) {
  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}/${month}/${day} ${hour}:${minute}`;
}

function filterDishes(dishes: RestaurantDish[], filter: DishFilter) {
  if (filter === "all") return dishes;
  return dishes.filter((dish) => dish.status === filter);
}

function getCategoryLabels(categoryIds: string[], categories: DishCategory[]) {
  return categoryIds
    .map((categoryId) => categories.find((category) => category.id === categoryId)?.name)
    .filter((name): name is string => Boolean(name));
}

function sameCategoryIds(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();

  return sortedLeft.every((categoryId, index) => categoryId === sortedRight[index]);
}

function CategorySelector({
  categories,
  selectedIds,
  onToggle,
  inputName,
}: {
  categories: DishCategory[];
  selectedIds?: string[];
  onToggle?: (categoryId: string) => void;
  inputName?: string;
}) {
  if (categories.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
        No hay categorías disponibles.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const isSelected = selectedIds?.includes(category.id) ?? false;

        if (onToggle) {
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onToggle(category.id)}
              className={clsx(
                "rounded-full px-3 py-1.5 text-xs font-extrabold transition",
                isSelected
                  ? "bg-orange-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-orange-500/10 dark:hover:text-orange-400",
              )}
            >
              {category.name}
            </button>
          );
        }

        return (
          <label
            key={category.id}
            className="cursor-pointer rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-700 transition has-[:checked]:bg-orange-600 has-[:checked]:text-white dark:bg-slate-800 dark:text-slate-200 dark:has-[:checked]:bg-orange-600"
          >
            <input
              type="checkbox"
              name={inputName}
              value={category.id}
              className="sr-only"
            />
            {category.name}
          </label>
        );
      })}
    </div>
  );
}

type RestaurantDishesPageData = RestaurantDishesResponse & {
  categories: DishCategory[];
};

async function loadRestaurantDishes(): Promise<RestaurantDishesPageData> {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error("No se encontró una sesión activa.");
  }

  const restaurantId = String(session.idTipoUsuario);
  const [dishesData, categories] = await Promise.all([
    getRestaurantDishes(restaurantId),
    getDishCategories(),
  ]);

  return {
    ...dishesData,
    categories,
  };
}

export default function RestaurantDishesPage() {
  // La pantalla se monta sin datos y cada panel muestra su loader propio hasta
  // que llega el listado inicial desde backend.
  const [restaurantId, setRestaurantId] = useState("");
  const [filter, setFilter] = useState<DishFilter>("all");
  const [dishes, setDishes] = useState<RestaurantDish[]>([]);
  const [savedDishes, setSavedDishes] = useState<RestaurantDish[]>([]);
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [selectedDishId, setSelectedDishId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Create form refs
  const createFormRef = useRef<HTMLFormElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategoryIds, setEditCategoryIds] = useState<string[]>([]);
  const [hasEditImageChange, setHasEditImageChange] = useState(false);
  const {
    data: loadedData,
    error: loadError,
    isLoading,
    reload,
  } = useAsyncData(loadRestaurantDishes, {
    onSuccess: (data) => applyDishesData(data, filter),
  });

  const filteredDishes = useMemo(() => {
    return filterDishes(dishes, filter);
  }, [dishes, filter]);

  const selectedDish =
    filteredDishes.find((dish) => dish.id === selectedDishId) ??
    filteredDishes[0] ??
    null;
  const savedSelectedDishData = savedDishes.find(
    (dish) => dish.id === selectedDish?.id,
  );
  const hasSelectedDishChanges =
    Boolean(selectedDish && savedSelectedDishData) &&
    (editName !== savedSelectedDishData?.name ||
      editDescription !== savedSelectedDishData?.description ||
      editPrice !==
        (savedSelectedDishData ? String(savedSelectedDishData.price) : "") ||
      !sameCategoryIds(editCategoryIds, savedSelectedDishData?.categoryIds ?? []) ||
      hasEditImageChange);

  function resetEditForm(dish: RestaurantDish | null) {
    setSelectedDishId(dish?.id ?? "");
    setEditName(dish?.name ?? "");
    setEditDescription(dish?.description ?? "");
    setEditPrice(dish ? String(dish.price) : "");
    setEditCategoryIds(dish?.categoryIds ?? []);
    setHasEditImageChange(false);
    if (editImageInputRef.current) {
      editImageInputRef.current.value = "";
    }
  }

  function toggleEditCategory(categoryId: string) {
    setEditCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  }

  function applyDishesData(
    nextData: RestaurantDishesPageData,
    currentFilter: DishFilter,
  ) {
    // Sincroniza listado, copia guardada y formulario de edicion con una misma
    // respuesta del backend para que cancelar vuelva siempre al ultimo dato real.
    const initialSelectedDish =
      filterDishes(nextData.dishes, currentFilter)[0] ?? null;

    setRestaurantId(nextData.restaurantId);
    setDishes(nextData.dishes);
    setSavedDishes(nextData.dishes);
    setCategories(nextData.categories);
    resetEditForm(initialSelectedDish);
    setShowCreateForm(!initialSelectedDish);
  }

  function selectDish(dish: RestaurantDish) {
    resetEditForm(dish);
    setShowCreateForm(false);
    setError(null);
  }

  function handleFilterChange(nextFilter: DishFilter) {
    const nextFilteredDishes = filterDishes(dishes, nextFilter);
    const selectedDishIsVisible = nextFilteredDishes.some(
      (dish) => dish.id === selectedDishId,
    );

    setFilter(nextFilter);

    if (selectedDishIsVisible) {
      return;
    }

    const nextDish = nextFilteredDishes[0] ?? null;
    resetEditForm(nextDish);
    setShowCreateForm(!nextDish);
    setError(null);
  }

  function handleCreate(formData: FormData) {
    if (!restaurantId) {
      return;
    }

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const price = Number(formData.get("price") ?? 0);
    const categoryIds = formData.getAll("categoryIds");

    if (!name || price <= 0) {
      setError("Nombre y precio son obligatorios");
      return;
    }

    if (!description) {
      setError("La descripción es obligatoria");
      return;
    }

    if (categoryIds.length === 0) {
      setError("Debe seleccionar al menos una categoría");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createDishAction(restaurantId, formData);

      if (result.error) {
        setError(result.error);
      } else {
        createFormRef.current?.reset();
        setShowCreateForm(false);
        // Refresh dish list without full page reload
        const [freshData, freshCategories] = await Promise.all([
          getRestaurantDishes(restaurantId),
          getDishCategories(),
        ]);
        const nextDish = filterDishes(freshData.dishes, filter)[0] ?? null;
        setDishes(freshData.dishes);
        setSavedDishes(freshData.dishes);
        setCategories(freshCategories);
        resetEditForm(nextDish);
        setShowCreateForm(!nextDish);
      }
    });
  }

  function handleUpdate() {
    if (!selectedDish || !restaurantId) return;

    const price = editPrice ? Number(editPrice) : undefined;
    if (price != null && (isNaN(price) || price <= 0)) {
      setError("El precio debe ser un numero positivo");
      return;
    }

    if (!editDescription.trim()) {
      setError("La descripción es obligatoria");
      return;
    }

    if (editCategoryIds.length === 0) {
      setError("Debe seleccionar al menos una categoría");
      return;
    }

    setError(null);
    const formData = new FormData();
    if (editName.trim()) formData.append("name", editName.trim());
    formData.append("description", editDescription.trim());
    if (price != null) formData.append("price", String(price));
    editCategoryIds.forEach((categoryId) => {
      formData.append("categoryIds", categoryId);
    });

    const fileInput = editImageInputRef.current;
    if (fileInput?.files?.[0]) {
      formData.append("image", fileInput.files[0]);
    }

    startTransition(async () => {
      const result = await updateDishAction(selectedDish.id, formData);

      if (result.error) {
        setError(result.error);
      } else {
        const updateCurrentDishes = (current: RestaurantDish[]) =>
          current.map((d) =>
            d.id === selectedDish.id
              ? {
                  ...d,
                  name: editName.trim() || d.name,
                  description: editDescription.trim(),
                  price: price ?? d.price,
                  categoryIds: editCategoryIds,
                }
              : d,
          );

        setDishes(updateCurrentDishes);
        setSavedDishes(updateCurrentDishes);
        setHasEditImageChange(false);
        if (editImageInputRef.current) {
          editImageInputRef.current.value = "";
        }
        setError(null);
      }
    });
  }

  function handleDelete() {
    if (!selectedDish || !restaurantId) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteDishAction(selectedDish.id);

      if (result.error) {
        setError(result.error);
      } else {
        const nextDishes = dishes.filter((d) => d.id !== selectedDish.id);
        const nextDish = filterDishes(nextDishes, filter)[0] ?? null;

        setDishes(nextDishes);
        setSavedDishes(nextDishes);
        resetEditForm(nextDish);
        setShowCreateForm(!nextDish);
      }
    });
  }

  function handleToggleAvailability() {
    if (!selectedDish || !restaurantId) return;

    setError(null);
    startTransition(async () => {
      const result = await toggleDishAvailabilityAction(selectedDish.id);

      if (result.error) {
        setError(result.error);
      } else {
        const updateCurrentDishes = (current: RestaurantDish[]) =>
          current.map((d) => {
            if (d.id !== selectedDish.id) {
              return d;
            }

            const nextStatus: DishStatus =
              d.status === "available" ? "unavailable" : "available";

            return {
              ...d,
              status: nextStatus,
            };
          });
        const nextDishes = updateCurrentDishes(dishes);
        const nextFilteredDishes = filterDishes(nextDishes, filter);
        const nextDish =
          nextFilteredDishes.find((dish) => dish.id === selectedDish.id) ??
          nextFilteredDishes[0] ??
          null;

        setDishes(nextDishes);
        setSavedDishes(nextDishes);
        resetEditForm(nextDish);
        setShowCreateForm(!nextDish);
      }
    });
  }

  function handleCancelChanges() {
    if (!savedSelectedDishData) {
      return;
    }

    setDishes((current) =>
      current.map((dish) =>
        dish.id === savedSelectedDishData.id ? savedSelectedDishData : dish,
      ),
    );
    setEditName(savedSelectedDishData.name);
    setEditDescription(savedSelectedDishData.description);
    setEditPrice(String(savedSelectedDishData.price));
    setEditCategoryIds(savedSelectedDishData.categoryIds);
    setHasEditImageChange(false);
    if (editImageInputRef.current) {
      editImageInputRef.current.value = "";
    }
    setError(null);
  }

  const isDataReady = Boolean(loadedData) && !isLoading && !loadError;
  const loadErrorMessage =
    loadError?.message ?? "No se pudieron cargar los platos.";

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
            disabled={!isDataReady}
            onChange={(event) =>
              handleFilterChange(event.target.value as DishFilter)
            }
            className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
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
              disabled={!isDataReady}
              onClick={() => {
                setShowCreateForm(true);
                setSelectedDishId("");
                setError(null);
              }}
              className="flex h-11 w-fit cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlusIcon className="h-5 w-5" />
              Nuevo plato
            </button>
          </div>

          <div className="space-y-4 p-3">
            {isLoading ? (
              <div className="py-8">
                <LoadingIndicator label="Cargando listado de platos..." />
              </div>
            ) : loadError ? (
              <PanelError message={loadErrorMessage} onRetry={reload} />
            ) : filteredDishes.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
                No hay platos para mostrar.
              </p>
            ) : null}
            {isDataReady && filteredDishes.map((dish) => {
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
                      <Image
                        src={dish.imageUrl}
                        alt={dish.name}
                        width={80}
                        height={80}
                        unoptimized
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
                    {dish.description && (
                      <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                        {dish.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {getCategoryLabels(dish.categoryIds, categories).map((categoryName) => (
                        <span
                          key={`${dish.id}-${categoryName}`}
                          className="rounded-full bg-orange-50 px-3 py-1 text-xs font-extrabold text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                        >
                          {categoryName}
                        </span>
                      ))}
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        Creado: {formatDateTimeLabel(dish.createdAt)}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={dish.status} />
                </button>
              );
            })}
          </div>
        </section>

        {isLoading && (
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Detalle del plato
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Los datos del plato se cargan en segundo plano.
              </p>
            </div>
            <div className="p-5 py-10">
              <LoadingIndicator label="Cargando detalle de platos..." />
            </div>
          </section>
        )}

        {loadError && (
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Detalle del plato
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                No se pudieron cargar los datos para editar.
              </p>
            </div>
            <div className="p-5">
              <PanelError message={loadErrorMessage} onRetry={reload} />
            </div>
          </section>
        )}

        {/* Create form panel */}
        {isDataReady && showCreateForm && (
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
                  Descripción
                </span>
                <textarea
                  name="description"
                  required
                  rows={4}
                  placeholder="Describe el plato para tus clientes"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                />
              </label>

              <div>
                <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  Categorías
                </span>
                <CategorySelector
                  categories={categories}
                  inputName="categoryIds"
                />
              </div>

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
        {isDataReady && !showCreateForm && selectedDish && (
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
                  Descripción
                </span>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                />
              </label>

              <div>
                <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  Categorías
                </span>
                <CategorySelector
                  categories={categories}
                  selectedIds={editCategoryIds}
                  onToggle={toggleEditCategory}
                />
              </div>

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
                  ref={editImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setHasEditImageChange(Boolean(e.target.files?.[0]))}
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
                <div className="flex h-11 w-full items-center rounded-xl border border-gray-200 bg-slate-50 px-4 text-sm font-extrabold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                  {formatDateTimeLabel(selectedDish.createdAt)}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-5 py-5 sm:flex-row sm:justify-end dark:border-slate-800">
              {hasSelectedDishChanges && (
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
