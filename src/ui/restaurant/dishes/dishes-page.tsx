"use client";

import {
  ArrowsUpDownIcon,
  CheckIcon,
  FunnelIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Image from "next/image";
import {
  type DragEvent,
  type FormEvent,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { useAsyncData } from "@/hooks/shared/use-async-data";
import type {
  DishCategory,
  DishStatus,
  RestaurantDish,
  RestaurantDishesResponse,
} from "@/lib/restaurant/dish/types";
import {
  createDish,
  deleteDish,
  getDishCategories,
  getRestaurantDishes,
  toggleDishAvailability,
  updateDish,
} from "@/services/restaurant/dish-service";
import { getCurrentSession } from "@/services/shared/auth-service";
import LoadingIndicator from "@/ui/shared/feedback/loading-indicator";
import PanelError from "@/ui/shared/feedback/panel-error";

type DishFilter = "all" | DishStatus;
type DishSort =
  | "name-asc"
  | "name-desc"
  | "created-desc"
  | "created-asc"
  | "price-desc"
  | "price-asc";

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

function getDateTimeValue(dateStr: string) {
  const date = new Date(dateStr);

  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function filterDishes(
  dishes: RestaurantDish[],
  filter: DishFilter,
  nameFilter: string,
  createdAfterFilter: string,
  createdBeforeFilter: string,
) {
  const normalizedNameFilter = normalizeSearchText(nameFilter);
  const createdAfterValue = createdAfterFilter
    ? new Date(createdAfterFilter).getTime()
    : null;
  const createdBeforeValue = createdBeforeFilter
    ? new Date(createdBeforeFilter).getTime()
    : null;

  return dishes.filter((dish) => {
    const dishCreatedAt = getDateTimeValue(dish.createdAt);
    const matchesStatus = filter === "all" || dish.status === filter;
    const matchesName =
      !normalizedNameFilter ||
      normalizeSearchText(dish.name).includes(normalizedNameFilter);
    const matchesCreatedAfter =
      createdAfterValue === null ||
      (dishCreatedAt !== null && dishCreatedAt >= createdAfterValue);
    const matchesCreatedBefore =
      createdBeforeValue === null ||
      (dishCreatedAt !== null && dishCreatedAt <= createdBeforeValue);

    return matchesStatus && matchesName && matchesCreatedAfter && matchesCreatedBefore;
  });
}

function sortDishes(dishes: RestaurantDish[], sort: DishSort) {
  return [...dishes].sort((left, right) => {
    if (sort === "name-asc") {
      return left.name.localeCompare(right.name, "es");
    }

    if (sort === "name-desc") {
      return right.name.localeCompare(left.name, "es");
    }

    if (sort === "created-desc") {
      return (
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime()
      );
    }

    if (sort === "created-asc") {
      return (
        new Date(left.createdAt).getTime() -
        new Date(right.createdAt).getTime()
      );
    }

    if (sort === "price-desc") {
      return right.price - left.price;
    }

    return left.price - right.price;
  });
}

function getVisibleDishes(
  dishes: RestaurantDish[],
  filter: DishFilter,
  nameFilter: string,
  createdAfterFilter: string,
  createdBeforeFilter: string,
  sort: DishSort,
) {
  return sortDishes(
    filterDishes(
      dishes,
      filter,
      nameFilter,
      createdAfterFilter,
      createdBeforeFilter,
    ),
    sort,
  );
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

export function CategorySelector({
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

function CategoryRows({
  categories,
  disabled,
  isAddingCategoryRow,
  onAdd,
  onCancel,
  onConfirm,
  onPendingChange,
  onRemove,
  pendingCategoryId,
  selectedIds,
}: {
  categories: DishCategory[];
  disabled: boolean;
  isAddingCategoryRow: boolean;
  onAdd: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onPendingChange: (categoryId: string) => void;
  onRemove: (categoryId: string) => void;
  pendingCategoryId: string;
  selectedIds: string[];
}) {
  const selectedCategories = selectedIds
    .map((categoryId) => categories.find((category) => category.id === categoryId))
    .filter((category): category is DishCategory => Boolean(category));
  const categoriesToAdd = categories.filter(
    (category) => !selectedIds.includes(category.id),
  );

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800">
        {selectedCategories.length === 0 && !isAddingCategoryRow ? (
          <p className="px-4 py-4 text-sm font-medium text-slate-400 dark:text-slate-500">
            No hay categorÃ­as asociadas.
          </p>
        ) : null}

        {selectedCategories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 text-sm font-extrabold text-slate-800 last:border-b-0 dark:border-slate-800 dark:text-slate-100"
          >
            <span className="min-w-0 truncate">{category.name}</span>
            <button
              type="button"
              onClick={() => onRemove(category.id)}
              disabled={disabled}
              aria-label={`Quitar ${category.name}`}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}

        {isAddingCategoryRow ? (
          <div className="grid gap-3 border-b border-gray-100 px-4 py-4 last:border-b-0 dark:border-slate-800">
            <select
              value={pendingCategoryId}
              onChange={(event) => onPendingChange(event.target.value)}
              disabled={disabled || categoriesToAdd.length === 0}
              className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              {categoriesToAdd.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onConfirm}
                disabled={disabled || categoriesToAdd.length === 0}
                aria-label="Confirmar categoría"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={disabled}
                aria-label="Cancelar categorÃ­a"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onAdd}
        disabled={disabled || isAddingCategoryRow || categoriesToAdd.length === 0}
        className="mt-3 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-50 px-5 text-sm font-extrabold text-orange-600 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
      >
        <PlusIcon className="h-5 w-5" />
        Agregar categorÃ­a
      </button>
    </>
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
  const [nameFilter, setNameFilter] = useState("");
  const [createdAfterFilter, setCreatedAfterFilter] = useState("");
  const [createdBeforeFilter, setCreatedBeforeFilter] = useState("");
  const [sort, setSort] = useState<DishSort>("created-desc");
  const [dishes, setDishes] = useState<RestaurantDish[]>([]);
  const [savedDishes, setSavedDishes] = useState<RestaurantDish[]>([]);
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [selectedDishId, setSelectedDishId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mobileEditingDishId, setMobileEditingDishId] = useState("");
  const [createCategoryIds, setCreateCategoryIds] = useState<string[]>([]);
  const [pendingCreateCategoryId, setPendingCreateCategoryId] = useState("");
  const [isAddingCreateCategoryRow, setIsAddingCreateCategoryRow] =
    useState(false);
  const [isPending, startTransition] = useTransition();
  const [createError, setCreateError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Create form refs
  const createFormRef = useRef<HTMLFormElement>(null);
  const createImageInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategoryIds, setEditCategoryIds] = useState<string[]>([]);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [hasEditImageChange, setHasEditImageChange] = useState(false);
  const [pendingEditCategoryId, setPendingEditCategoryId] = useState("");
  const [isAddingEditCategoryRow, setIsAddingEditCategoryRow] = useState(false);
  const {
    data: loadedData,
    error: loadError,
    isLoading,
    reload,
  } = useAsyncData(loadRestaurantDishes, {
    onSuccess: (data) => applyDishesData(data, filter),
  });

  const filteredDishes = useMemo(() => {
    return getVisibleDishes(
      dishes,
      filter,
      nameFilter,
      createdAfterFilter,
      createdBeforeFilter,
      sort,
    );
  }, [dishes, filter, nameFilter, createdAfterFilter, createdBeforeFilter, sort]);

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
    setEditImageFile(null);
    setHasEditImageChange(false);
    setPendingEditCategoryId("");
    setIsAddingEditCategoryRow(false);
    if (editImageInputRef.current) {
      editImageInputRef.current.value = "";
    }
  }

  function startAddingEditCategory() {
    const nextCategory = categories.find(
      (category) => !editCategoryIds.includes(category.id),
    );

    if (!nextCategory) {
      return;
    }

    setPendingEditCategoryId(nextCategory.id);
    setIsAddingEditCategoryRow(true);
    setDetailError(null);
  }

  function confirmEditCategory() {
    const categoryId =
      pendingEditCategoryId ||
      categories.find((category) => !editCategoryIds.includes(category.id))?.id;

    if (!categoryId) {
      setDetailError("No hay categorÃ­as disponibles para agregar.");
      return;
    }

    if (editCategoryIds.includes(categoryId)) {
      setDetailError("Esa categorÃ­a ya esta asociada al plato.");
      return;
    }

    setEditCategoryIds((current) => [...current, categoryId]);
    setPendingEditCategoryId("");
    setIsAddingEditCategoryRow(false);
    setDetailError(null);
  }

  function removeEditCategory(categoryId: string) {
    setEditCategoryIds((current) => current.filter((id) => id !== categoryId));
    setDetailError(null);
  }

  function resetCreateForm() {
    createFormRef.current?.reset();
    setCreateCategoryIds([]);
    setPendingCreateCategoryId("");
    setIsAddingCreateCategoryRow(false);
  }

  function startAddingCreateCategory() {
    const nextCategory = categories.find(
      (category) => !createCategoryIds.includes(category.id),
    );

    if (!nextCategory) {
      return;
    }

    setPendingCreateCategoryId(nextCategory.id);
    setIsAddingCreateCategoryRow(true);
    setCreateError(null);
  }

  function confirmCreateCategory() {
    const categoryId =
      pendingCreateCategoryId ||
      categories.find((category) => !createCategoryIds.includes(category.id))?.id;

    if (!categoryId) {
      setCreateError("No hay categorÃ­as disponibles para agregar.");
      return;
    }

    if (createCategoryIds.includes(categoryId)) {
      setCreateError("Esa categorÃ­a ya esta asociada al plato.");
      return;
    }

    setCreateCategoryIds((current) => [...current, categoryId]);
    setPendingCreateCategoryId("");
    setIsAddingCreateCategoryRow(false);
    setCreateError(null);
  }

  function removeCreateCategory(categoryId: string) {
    setCreateCategoryIds((current) => current.filter((id) => id !== categoryId));
    setCreateError(null);
  }

  function applyDishesData(
    nextData: RestaurantDishesPageData,
    currentFilter: DishFilter,
  ) {
    // Sincroniza listado, copia guardada y formulario de edicion con una misma
    // respuesta del backend para que cancelar vuelva siempre al ultimo dato real.
    const initialSelectedDish =
      getVisibleDishes(
        nextData.dishes,
        currentFilter,
        nameFilter,
        createdAfterFilter,
        createdBeforeFilter,
        sort,
      )[0] ?? null;

    setRestaurantId(nextData.restaurantId);
    setDishes(nextData.dishes);
    setSavedDishes(nextData.dishes);
    setCategories(nextData.categories);
    resetEditForm(initialSelectedDish);
    setShowCreateForm(!initialSelectedDish);
    resetCreateForm();
  }

  function selectDish(dish: RestaurantDish) {
    resetEditForm(dish);
    resetCreateForm();
    setShowCreateForm(false);
    setMobileEditingDishId("");
    setCreateError(null);
    setDetailError(null);
  }

  function handleFilterChange(nextFilter: DishFilter) {
    const nextFilteredDishes = getVisibleDishes(
      dishes,
      nextFilter,
      nameFilter,
      createdAfterFilter,
      createdBeforeFilter,
      sort,
    );
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
    setMobileEditingDishId("");
    setCreateError(null);
    setDetailError(null);
  }

  function handleNameFilterChange(nextNameFilter: string) {
    const nextFilteredDishes = getVisibleDishes(
      dishes,
      filter,
      nextNameFilter,
      createdAfterFilter,
      createdBeforeFilter,
      sort,
    );
    const selectedDishIsVisible = nextFilteredDishes.some(
      (dish) => dish.id === selectedDishId,
    );

    setNameFilter(nextNameFilter);

    if (selectedDishIsVisible) {
      return;
    }

    const nextDish = nextFilteredDishes[0] ?? null;
    resetEditForm(nextDish);
    setShowCreateForm(!nextDish);
    setMobileEditingDishId("");
    setCreateError(null);
    setDetailError(null);
  }

  function handleCreatedRangeFilterChange(
    nextCreatedAfterFilter: string,
    nextCreatedBeforeFilter: string,
  ) {
    const nextFilteredDishes = getVisibleDishes(
      dishes,
      filter,
      nameFilter,
      nextCreatedAfterFilter,
      nextCreatedBeforeFilter,
      sort,
    );
    const selectedDishIsVisible = nextFilteredDishes.some(
      (dish) => dish.id === selectedDishId,
    );

    setCreatedAfterFilter(nextCreatedAfterFilter);
    setCreatedBeforeFilter(nextCreatedBeforeFilter);

    if (selectedDishIsVisible) {
      return;
    }

    const nextDish = nextFilteredDishes[0] ?? null;
    resetEditForm(nextDish);
    setShowCreateForm(!nextDish);
    setMobileEditingDishId("");
    setCreateError(null);
    setDetailError(null);
  }

  function clearFilters() {
    const nextFilteredDishes = getVisibleDishes(dishes, "all", "", "", "", sort);
    const selectedDishIsVisible = nextFilteredDishes.some(
      (dish) => dish.id === selectedDishId,
    );

    setFilter("all");
    setNameFilter("");
    setCreatedAfterFilter("");
    setCreatedBeforeFilter("");

    if (selectedDishIsVisible) {
      return;
    }

    const nextDish = nextFilteredDishes[0] ?? null;
    resetEditForm(nextDish);
    setShowCreateForm(!nextDish);
    setMobileEditingDishId("");
    setCreateError(null);
    setDetailError(null);
  }

  function handleSortChange(nextSort: DishSort) {
    const nextVisibleDishes = getVisibleDishes(
      dishes,
      filter,
      nameFilter,
      createdAfterFilter,
      createdBeforeFilter,
      nextSort,
    );
    const selectedDishIsVisible = nextVisibleDishes.some(
      (dish) => dish.id === selectedDishId,
    );

    setSort(nextSort);

    if (selectedDishIsVisible) {
      return;
    }

    const nextDish = nextVisibleDishes[0] ?? null;
    resetEditForm(nextDish);
    setShowCreateForm(!nextDish);
    setMobileEditingDishId("");
    setCreateError(null);
    setDetailError(null);
  }

  function handleCreate(formData: FormData) {
    if (!restaurantId) {
      return;
    }

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const price = Number(formData.get("price") ?? 0);

    if (!name || price <= 0) {
      setCreateError("Nombre y precio son obligatorios");
      return;
    }

    if (!description) {
      setCreateError("La descripción es obligatoria");
      return;
    }

    if (createCategoryIds.length === 0) {
      setCreateError("Debe seleccionar al menos una categoría");
      return;
    }

    setCreateError(null);
    startTransition(async () => {
      try {
        await createDish(restaurantId, {
          name,
          description,
          price,
          categoryIds: createCategoryIds,
          image: (formData.get("image") as File | null) ?? null,
        });
        resetCreateForm();
        setShowCreateForm(false);
        // Refresh dish list without full page reload
        const [freshData, freshCategories] = await Promise.all([
          getRestaurantDishes(restaurantId),
          getDishCategories(),
        ]);
        const nextDish =
          getVisibleDishes(
            freshData.dishes,
            filter,
            nameFilter,
            createdAfterFilter,
            createdBeforeFilter,
            sort,
          )[0] ?? null;
        setDishes(freshData.dishes);
        setSavedDishes(freshData.dishes);
        setCategories(freshCategories);
        resetEditForm(nextDish);
        setShowCreateForm(!nextDish);
        setMobileEditingDishId("");
      } catch (error) {
        setCreateError(
          error instanceof Error ? error.message : "Error al crear plato",
        );
      }
    });
  }

  function handleUpdate() {
    if (!selectedDish || !restaurantId) return;

    const price = editPrice ? Number(editPrice) : undefined;
    if (price != null && (isNaN(price) || price <= 0)) {
      setDetailError("El precio debe ser un numero positivo");
      return;
    }

    if (!editDescription.trim()) {
      setDetailError("La descripción es obligatoria");
      return;
    }

    if (editCategoryIds.length === 0) {
      setDetailError("Debe seleccionar al menos una categoría");
      return;
    }

    setDetailError(null);
    startTransition(async () => {
      try {
        await updateDish(selectedDish.id, {
          name: editName.trim() || undefined,
          description: editDescription.trim(),
          price,
          categoryIds: editCategoryIds,
          image: editImageFile,
        });
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
        setEditImageFile(null);
        setHasEditImageChange(false);
        setMobileEditingDishId("");
        if (editImageInputRef.current) {
          editImageInputRef.current.value = "";
        }
        setDetailError(null);
      } catch (error) {
        setDetailError(
          error instanceof Error ? error.message : "Error al modificar plato",
        );
      }
    });
  }

  function handleDelete() {
    if (!selectedDish || !restaurantId) return;

    deleteDishAndUpdateList(selectedDish.id);
  }

  function handleDeleteById(dishId: string) {
    if (!restaurantId) return;

    deleteDishAndUpdateList(dishId);
  }

  function deleteDishAndUpdateList(dishId: string) {
    setDetailError(null);
    startTransition(async () => {
      try {
        await deleteDish(dishId);
        const nextDishes = dishes.filter((d) => d.id !== dishId);
        const nextDish =
          getVisibleDishes(
            nextDishes,
            filter,
            nameFilter,
            createdAfterFilter,
            createdBeforeFilter,
            sort,
          )[0] ?? null;

        setDishes(nextDishes);
        setSavedDishes(nextDishes);
        resetEditForm(nextDish);
        setShowCreateForm(!nextDish);
        setMobileEditingDishId("");
      } catch (error) {
        setDetailError(
          error instanceof Error ? error.message : "Error al eliminar plato",
        );
      }
    });
  }

  function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleCreate(new FormData(event.currentTarget));
  }

  function handleCreateImageDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault();
  }

  function handleCreateImageDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();

    const droppedImage = Array.from(event.dataTransfer.files).find((file) =>
      file.type.startsWith("image/"),
    );

    if (!droppedImage || !createImageInputRef.current) {
      return;
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(droppedImage);
    createImageInputRef.current.files = dataTransfer.files;
  }

  function handleToggleAvailability() {
    if (!selectedDish || !restaurantId) return;

    setDetailError(null);
    startTransition(async () => {
      try {
        await toggleDishAvailability(selectedDish.id);
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
        const nextFilteredDishes = getVisibleDishes(
          nextDishes,
          filter,
          nameFilter,
          createdAfterFilter,
          createdBeforeFilter,
          sort,
        );
        const nextDish =
          nextFilteredDishes.find((dish) => dish.id === selectedDish.id) ??
          nextFilteredDishes[0] ??
          null;

        setDishes(nextDishes);
        setSavedDishes(nextDishes);
        resetEditForm(nextDish);
        setShowCreateForm(!nextDish);
        setMobileEditingDishId("");
      } catch (error) {
        setDetailError(
          error instanceof Error
            ? error.message
            : "Error al cambiar disponibilidad",
        );
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
    setEditImageFile(null);
    setHasEditImageChange(false);
    if (editImageInputRef.current) {
      editImageInputRef.current.value = "";
    }
    setDetailError(null);
  }

  function handleEditImageChange(fileList: FileList | null) {
    const file = fileList?.[0] ?? null;
    setEditImageFile(file);
    setHasEditImageChange(Boolean(file));
  }

  const isDataReady = Boolean(loadedData) && !isLoading && !loadError;
  const loadErrorMessage =
    loadError?.message ?? "No se pudieron cargar los platos.";
  const hasActiveFilters =
    Boolean(nameFilter) ||
    Boolean(createdAfterFilter) ||
    Boolean(createdBeforeFilter) ||
    filter !== "all";

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 xl:hidden">
          <div className="flex items-center gap-4">
            <button
              type="button"
              disabled={!isDataReady}
              onClick={() => setIsMobileFiltersOpen(true)}
              className="flex h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-extrabold text-slate-700 transition hover:border-orange-200 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
            >
              <FunnelIcon className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-orange-600 dark:bg-orange-400" />
              )}
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                disabled={!isDataReady}
                onClick={clearFilters}
                aria-label="Limpiar filtros"
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition hover:border-orange-200 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
              >
                <FunnelIcon className="h-5 w-5" />
                <XMarkIcon className="absolute right-2 top-2 h-3 w-3 stroke-[3]" />
              </button>
            )}

            <div className="ml-auto flex min-w-0 items-center gap-2">
              <ArrowsUpDownIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
              <label htmlFor="dish-sort-mobile" className="sr-only">
                Orden
              </label>
              <select
                id="dish-sort-mobile"
                value={sort}
                disabled={!isDataReady}
                onChange={(event) =>
                  handleSortChange(event.target.value as DishSort)
                }
                className="h-11 w-[125px] rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
              >
                <option value="name-asc">Nombre A-Z</option>
                <option value="name-desc">Nombre Z-A</option>
                <option value="created-desc">Mas nuevos</option>
                <option value="created-asc">Mas antiguos</option>
                <option value="price-desc">Mas caros</option>
                <option value="price-asc">Mas baratos</option>
              </select>
            </div>
          </div>

          {isMobileFiltersOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 px-4 pb-4 pt-20 backdrop-blur-sm sm:items-center sm:pt-16">
              <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-xl sm:max-w-md dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                      Filtros
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                      Ajusta el listado de platos visible.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(false)}
                    aria-label="Cerrar filtros"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:text-orange-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-orange-400"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid gap-4 px-5 py-5">
                  <label htmlFor="dish-name-filter-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Nombre
                    </span>
                    <input
                      id="dish-name-filter-mobile"
                      type="search"
                      value={nameFilter}
                      disabled={!isDataReady}
                      onChange={(event) =>
                        handleNameFilterChange(event.target.value)
                      }
                      placeholder="Buscar plato"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20"
                    />
                  </label>

                  <label
                    htmlFor="dish-created-after-filter-mobile"
                    className="block"
                  >
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Creado despues de
                    </span>
                    <input
                      id="dish-created-after-filter-mobile"
                      type="datetime-local"
                      value={createdAfterFilter}
                      disabled={!isDataReady}
                      onChange={(event) =>
                        handleCreatedRangeFilterChange(
                          event.target.value,
                          createdBeforeFilter,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark] dark:focus:ring-orange-500/20"
                    />
                  </label>

                  <label
                    htmlFor="dish-created-before-filter-mobile"
                    className="block"
                  >
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Creado antes de
                    </span>
                    <input
                      id="dish-created-before-filter-mobile"
                      type="datetime-local"
                      value={createdBeforeFilter}
                      disabled={!isDataReady}
                      onChange={(event) =>
                        handleCreatedRangeFilterChange(
                          createdAfterFilter,
                          event.target.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark] dark:focus:ring-orange-500/20"
                    />
                  </label>

                  <label htmlFor="dish-status-filter-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Estado
                    </span>
                    <select
                      id="dish-status-filter-mobile"
                      value={filter}
                      disabled={!isDataReady}
                      onChange={(event) =>
                        handleFilterChange(event.target.value as DishFilter)
                      }
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                    >
                      <option value="all">Todos</option>
                      <option value="available">Disponibles</option>
                      <option value="unavailable">No disponibles</option>
                    </select>
                  </label>
                </div>

                <div className="flex gap-3 border-t border-gray-200 px-5 py-4 dark:border-slate-800">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      disabled={!isDataReady}
                      onClick={clearFilters}
                      className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-500 transition hover:border-orange-200 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
                    >
                      Limpiar filtros
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="h-11 flex-1 rounded-xl bg-orange-600 px-4 text-sm font-extrabold text-white transition hover:bg-orange-700"
                  >
                    Ver resultados
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="hidden gap-4 xl:flex xl:items-end xl:justify-between">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[240px_190px_190px_150px_auto] xl:items-end">
            <label htmlFor="dish-name-filter" className="block">
              <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                Nombre
              </span>
              <input
                id="dish-name-filter"
                type="search"
                value={nameFilter}
                disabled={!isDataReady}
                onChange={(event) => handleNameFilterChange(event.target.value)}
                placeholder="Buscar plato"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20"
              />
            </label>

            <label htmlFor="dish-created-after-filter" className="block">
              <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                Creado despues de
              </span>
              <input
                id="dish-created-after-filter"
                type="datetime-local"
                value={createdAfterFilter}
                disabled={!isDataReady}
                onChange={(event) =>
                  handleCreatedRangeFilterChange(
                    event.target.value,
                    createdBeforeFilter,
                  )
                }
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark] dark:focus:ring-orange-500/20"
              />
            </label>

            <label htmlFor="dish-created-before-filter" className="block">
              <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                Creado antes de
              </span>
              <input
                id="dish-created-before-filter"
                type="datetime-local"
                value={createdBeforeFilter}
                disabled={!isDataReady}
                onChange={(event) =>
                  handleCreatedRangeFilterChange(
                    createdAfterFilter,
                    event.target.value,
                  )
                }
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark] dark:focus:ring-orange-500/20"
              />
            </label>

            <label htmlFor="dish-status-filter" className="block">
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
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
              >
                <option value="all">Todos</option>
                <option value="available">Disponibles</option>
                <option value="unavailable">No disponibles</option>
              </select>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                disabled={!isDataReady}
                onClick={clearFilters}
                aria-label="Limpiar filtros"
                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition hover:border-orange-200 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
              >
                <FunnelIcon className="h-5 w-5" />
                <XMarkIcon className="absolute right-2 top-2 h-3 w-3 stroke-[3]" />
              </button>
            )}
          </div>

          <label htmlFor="dish-sort" className="block w-full xl:w-[180px]">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Orden
            </span>
            <select
              id="dish-sort"
              value={sort}
              disabled={!isDataReady}
              onChange={(event) =>
                handleSortChange(event.target.value as DishSort)
              }
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              <option value="name-asc">Nombre A-Z</option>
              <option value="name-desc">Nombre Z-A</option>
              <option value="created-desc">Mas nuevos</option>
              <option value="created-asc">Mas antiguos</option>
              <option value="price-desc">Mas caros</option>
              <option value="price-asc">Mas baratos</option>
            </select>
          </label>
        </div>
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
                resetCreateForm();
                setShowCreateForm(true);
                setSelectedDishId("");
                setMobileEditingDishId("");
                setCreateError(null);
                setDetailError(null);
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
              const isEditingInline =
                mobileEditingDishId === dish.id && selectedDish?.id === dish.id;

              return (
                <article
                  key={dish.id}
                  className={clsx(
                    "rounded-2xl border transition hover:border-orange-200 hover:bg-orange-50/40 dark:hover:border-orange-500/30 dark:hover:bg-orange-500/10",
                    isSelected
                      ? "border-orange-200 bg-orange-50/40 dark:border-orange-500/30 dark:bg-orange-500/10"
                      : "border-transparent bg-white dark:bg-slate-900",
                  )}
                >
                  {!isEditingInline && (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => selectDish(dish)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          selectDish(dish);
                        }
                      }}
                      className="grid w-full cursor-pointer grid-cols-[96px_minmax(0,1fr)] gap-4 p-4 text-left md:grid-cols-[96px_minmax(0,1fr)_auto] md:items-start"
                    >
                      <div className="col-start-1 row-start-1 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-orange-50 dark:bg-orange-500/10">
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
                      <div className="col-start-2 row-start-1 flex items-start justify-end gap-2 md:col-start-3">
                        <StatusBadge status={dish.status} />
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            selectDish(dish);
                            setMobileEditingDishId(dish.id);
                          }}
                          aria-label="Editar plato"
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-gray-100 transition hover:text-orange-600 xl:hidden dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800 dark:hover:text-orange-400"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteById(dish.id);
                          }}
                          disabled={isPending}
                          aria-label="Eliminar plato"
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-white text-red-500 shadow-sm ring-1 ring-gray-100 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 xl:hidden dark:bg-slate-950 dark:text-red-400 dark:ring-slate-800 dark:hover:bg-red-500/10"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="col-span-2 row-start-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
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
                    </div>
                  )}

                  {isEditingInline && selectedDish && (
                    <div className="space-y-4 p-4 xl:hidden">
                      {detailError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                          {detailError}
                        </div>
                      )}

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
                        <CategoryRows
                          categories={categories}
                          disabled={isPending}
                          isAddingCategoryRow={isAddingEditCategoryRow}
                          onAdd={startAddingEditCategory}
                          onCancel={() => {
                            setIsAddingEditCategoryRow(false);
                            setPendingEditCategoryId("");
                          }}
                          onConfirm={confirmEditCategory}
                          onPendingChange={setPendingEditCategoryId}
                          onRemove={removeEditCategory}
                          pendingCategoryId={pendingEditCategoryId}
                          selectedIds={editCategoryIds}
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
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleEditImageChange(e.target.files)}
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 pt-2 text-sm font-medium text-slate-700 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-1 file:text-xs file:font-extrabold file:text-orange-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:file:bg-orange-500/10 dark:file:text-orange-300 dark:focus:ring-orange-500/20"
                        />
                      </label>

                      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            handleCancelChanges();
                            setMobileEditingDishId("");
                          }}
                          className="h-11 cursor-pointer rounded-xl bg-slate-100 px-5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          Cancelar
                        </button>
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
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {isLoading && (
          <section className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm xl:block dark:border-slate-800 dark:bg-slate-900">
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
          <section className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm xl:block dark:border-slate-800 dark:bg-slate-900">
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
          <section className="order-first overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm xl:order-none dark:border-slate-800 dark:bg-slate-900">
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
              onSubmit={handleCreateSubmit}
              className="space-y-4 p-5"
            >
              {createError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                  {createError}
                </div>
              )}

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
                <CategoryRows
                  categories={categories}
                  disabled={isPending}
                  isAddingCategoryRow={isAddingCreateCategoryRow}
                  onAdd={startAddingCreateCategory}
                  onCancel={() => {
                    setIsAddingCreateCategoryRow(false);
                    setPendingCreateCategoryId("");
                  }}
                  onConfirm={confirmCreateCategory}
                  onPendingChange={setPendingCreateCategoryId}
                  onRemove={removeCreateCategory}
                  pendingCategoryId={pendingCreateCategoryId}
                  selectedIds={createCategoryIds}
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

              <label
                className="block"
                onDragOver={handleCreateImageDragOver}
                onDrop={handleCreateImageDrop}
              >
                <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  Imagen (opcional)
                </span>
                <input
                  ref={createImageInputRef}
                  type="file"
                  name="image"
                  accept="image/*"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 pt-2 text-sm font-medium text-slate-700 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-1 file:text-xs file:font-extrabold file:text-orange-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:file:bg-orange-500/10 dark:file:text-orange-300 dark:focus:ring-orange-500/20"
                />
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateError(null);
                    resetCreateForm();
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
          <section className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm xl:block dark:border-slate-800 dark:bg-slate-900">
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
              {detailError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                  {detailError}
                </div>
              )}

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
                <CategoryRows
                  categories={categories}
                  disabled={isPending}
                  isAddingCategoryRow={isAddingEditCategoryRow}
                  onAdd={startAddingEditCategory}
                  onCancel={() => {
                    setIsAddingEditCategoryRow(false);
                    setPendingEditCategoryId("");
                  }}
                  onConfirm={confirmEditCategory}
                  onPendingChange={setPendingEditCategoryId}
                  onRemove={removeEditCategory}
                  pendingCategoryId={pendingEditCategoryId}
                  selectedIds={editCategoryIds}
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
                  onChange={(e) => handleEditImageChange(e.target.files)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 pt-2 text-sm font-medium text-slate-700 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-1 file:text-xs file:font-extrabold file:text-orange-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:file:bg-orange-500/10 dark:file:text-orange-300 dark:focus:ring-orange-500/20"
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
