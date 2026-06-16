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
import { useEffect, useMemo, useState } from "react";

import { useAsyncData } from "@/hooks/shared/use-async-data";
import type {
  DiscountDish,
  DiscountStatus,
  RestaurantDiscount,
  RestaurantDiscountsResponse,
} from "@/lib/restaurant/discount/types";
import {
  createRestaurantDiscount,
  deleteRestaurantDiscount,
  getRestaurantDiscounts,
  updateRestaurantDiscount,
} from "@/services/restaurant/discount-service";
import { getCurrentSession } from "@/services/shared/auth-service";
import LoadingIndicator from "@/ui/shared/feedback/loading-indicator";
import PanelError from "@/ui/shared/feedback/panel-error";

type DiscountFilter = "all" | DiscountStatus;
type DiscountSort =
  | "created-desc"
  | "created-asc"
  | "percentage-desc"
  | "percentage-asc"
  | "expires-desc"
  | "expires-asc";

const NEW_DISCOUNT_ID = "new-discount";

function getDiscountTitle(discount: RestaurantDiscount) {
  return `Descuento en ${discount.dishes.length} ${
    discount.dishes.length === 1 ? "plato" : "platos"
  }`;
}

function getDishSummary(discount: RestaurantDiscount) {
  return discount.dishes.map((dish) => dish.name).join(", ");
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
  dishFilter: string,
  createdAfterFilter: string,
  createdBeforeFilter: string,
) {
  const normalizedDishFilter = normalizeSearchText(dishFilter);
  const createdAfterValue = createdAfterFilter
    ? new Date(createdAfterFilter).getTime()
    : null;
  const createdBeforeValue = createdBeforeFilter
    ? new Date(createdBeforeFilter).getTime()
    : null;

  return discounts.filter((discount) => {
    const discountCreatedAt = getDateTimeValue(discount.createdAt);
    const matchesStatus = filter === "all" || discount.status === filter;
    const matchesDish =
      !normalizedDishFilter ||
      normalizeSearchText(getDishSummary(discount)).includes(normalizedDishFilter);
    const matchesCreatedAfter =
      createdAfterValue === null ||
      (discountCreatedAt !== null && discountCreatedAt >= createdAfterValue);
    const matchesCreatedBefore =
      createdBeforeValue === null ||
      (discountCreatedAt !== null && discountCreatedAt <= createdBeforeValue);

    return matchesStatus && matchesDish && matchesCreatedAfter && matchesCreatedBefore;
  });
}

function getDateTimeValue(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function sortDiscounts(discounts: RestaurantDiscount[], sort: DiscountSort) {
  return [...discounts].sort((left, right) => {
    if (sort === "created-desc") {
      return (
        (getDateTimeValue(right.createdAt) ?? 0) -
        (getDateTimeValue(left.createdAt) ?? 0)
      );
    }

    if (sort === "created-asc") {
      return (
        (getDateTimeValue(left.createdAt) ?? 0) -
        (getDateTimeValue(right.createdAt) ?? 0)
      );
    }

    if (sort === "percentage-desc") {
      return right.percentage - left.percentage;
    }

    if (sort === "percentage-asc") {
      return left.percentage - right.percentage;
    }

    if (sort === "expires-desc") {
      return (
        (getDateTimeValue(right.expiresAt) ?? 0) -
        (getDateTimeValue(left.expiresAt) ?? 0)
      );
    }

    return (
      (getDateTimeValue(left.expiresAt) ?? 0) -
      (getDateTimeValue(right.expiresAt) ?? 0)
    );
  });
}

function getVisibleDiscounts(
  discounts: RestaurantDiscount[],
  filter: DiscountFilter,
  dishFilter: string,
  createdAfterFilter: string,
  createdBeforeFilter: string,
  sort: DiscountSort,
) {
  return sortDiscounts(
    filterDiscounts(
      discounts,
      filter,
      dishFilter,
      createdAfterFilter,
      createdBeforeFilter,
    ),
    sort,
  );
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

function getDefaultExpiration() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  date.setHours(23, 59, 0, 0);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function createEmptyDiscount(): RestaurantDiscount {
  return {
    id: NEW_DISCOUNT_ID,
    percentage: 10,
    status: "active",
    createdAt: "Nuevo",
    expiresAt: getDefaultExpiration(),
    dishes: [],
    isNew: true,
  };
}

async function loadRestaurantDiscounts(): Promise<RestaurantDiscountsResponse> {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error("No se encontró una sesión activa.");
  }

  return getRestaurantDiscounts(String(session.idTipoUsuario));
}

export default function RestaurantDiscountsPage() {
  // Mantenemos una copia editable y otra guardada. Si una operacion al backend
  // falla, el formulario no se pisa y el usuario puede reintentar.
  const [restaurantId, setRestaurantId] = useState("");
  const [filter, setFilter] = useState<DiscountFilter>("all");
  const [dishFilter, setDishFilter] = useState("");
  const [createdAfterFilter, setCreatedAfterFilter] = useState("");
  const [createdBeforeFilter, setCreatedBeforeFilter] = useState("");
  const [sort, setSort] = useState<DiscountSort>("created-desc");
  const [discounts, setDiscounts] = useState<RestaurantDiscount[]>([]);
  const [savedDiscounts, setSavedDiscounts] = useState<RestaurantDiscount[]>([]);
  const [availableDishes, setAvailableDishes] = useState<DiscountDish[]>([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState("");
  const [pendingDishId, setPendingDishId] = useState("");
  const [isAddingDishRow, setIsAddingDishRow] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createDiscount, setCreateDiscount] =
    useState<RestaurantDiscount>(createEmptyDiscount);
  const [editPercentage, setEditPercentage] = useState(0);
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [editStatus, setEditStatus] = useState<DiscountStatus>("active");
  const [editDishes, setEditDishes] = useState<DiscountDish[]>([]);
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [isDeletingDiscount, setIsDeletingDiscount] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mobileEditingDiscountId, setMobileEditingDiscountId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const {
    data: loadedData,
    error: loadError,
    isLoading,
    reload,
  } = useAsyncData(loadRestaurantDiscounts, {
    onSuccess: (data) => applyDiscountsData(data, filter),
  });

  useEffect(() => {
    if (!formError) {
      return;
    }

    const timeoutId = window.setTimeout(() => setFormError(null), 5000);

    return () => window.clearTimeout(timeoutId);
  }, [formError]);

  const filteredDiscounts = useMemo(() => {
    return getVisibleDiscounts(
      discounts,
      filter,
      dishFilter,
      createdAfterFilter,
      createdBeforeFilter,
      sort,
    );
  }, [discounts, filter, dishFilter, createdAfterFilter, createdBeforeFilter, sort]);

  const selectedDiscount =
    filteredDiscounts.find((discount) => discount.id === selectedDiscountId) ??
    filteredDiscounts[0] ??
    null;
  const savedSelectedDiscount = savedDiscounts.find(
    (discount) => discount.id === selectedDiscount?.id,
  );
  const editableSelectedDiscount = selectedDiscount
    ? {
        ...selectedDiscount,
        percentage: editPercentage,
        status: editStatus,
        expiresAt: editExpiresAt,
        dishes: editDishes,
      }
    : null;
  const hasSelectedDiscountChanges =
    Boolean(selectedDiscount && savedSelectedDiscount) &&
    (editPercentage !== savedSelectedDiscount?.percentage ||
      editStatus !== savedSelectedDiscount?.status ||
      editExpiresAt !== savedSelectedDiscount?.expiresAt ||
      !areDishesEqual(editDishes, savedSelectedDiscount?.dishes ?? []));

  function applyDiscountsData(
    nextData: RestaurantDiscountsResponse,
    currentFilter: DiscountFilter,
    preferredSelectedDiscountId = "",
  ) {
    // Mantiene en memoria el listado editable y su copia guardada. La copia
    // guardada es la referencia para detectar cambios y cancelar sin recargar.
    const nextFilteredDiscounts = getVisibleDiscounts(
      nextData.discounts,
      currentFilter,
      dishFilter,
      createdAfterFilter,
      createdBeforeFilter,
      sort,
    );
    const nextSelectedDiscount =
      nextFilteredDiscounts.find(
        (discount) => discount.id === preferredSelectedDiscountId,
      ) ??
      nextFilteredDiscounts[0] ??
      null;

    setRestaurantId(nextData.restaurantId);
    setAvailableDishes(nextData.availableDishes);
    setDiscounts(nextData.discounts);
    setSavedDiscounts(nextData.discounts);
    setSelectedDiscountId(nextSelectedDiscount?.id ?? "");
    resetEditForm(nextSelectedDiscount);
    setPendingDishId("");
    setIsAddingDishRow(false);
    setShowCreateForm(!nextSelectedDiscount);
    setCreateDiscount(createEmptyDiscount());
    setIsAddingDish(false);
    setIsSavingChanges(false);
    setIsDeletingDiscount(false);
    setMobileEditingDiscountId("");
    setFormError(null);
  }

  function resetEditForm(discount: RestaurantDiscount | null) {
    setEditPercentage(discount?.percentage ?? 0);
    setEditExpiresAt(discount?.expiresAt ?? "");
    setEditStatus(discount?.status ?? "active");
    setEditDishes(discount?.dishes ?? []);
  }

  async function refreshDiscountsData(
    currentFilter: DiscountFilter,
    preferredSelectedDiscountId = "",
  ) {
    if (!restaurantId) {
      throw new Error("No se encontrÃ³ el local para recargar descuentos.");
    }

    const freshData = await getRestaurantDiscounts(restaurantId);
    applyDiscountsData(freshData, currentFilter, preferredSelectedDiscountId);
  }

  function showNewDiscountForm() {
    setDiscounts(savedDiscounts);
    resetEditForm(null);
    setShowCreateForm(true);
    setSelectedDiscountId("");
    setCreateDiscount(createEmptyDiscount());
    setPendingDishId("");
    setIsAddingDishRow(false);
    setIsAddingDish(false);
    setIsSavingChanges(false);
    setIsDeletingDiscount(false);
    setMobileEditingDiscountId("");
    setFormError(null);
  }

  function updateSelectedDiscount(updates: Partial<RestaurantDiscount>) {
    if (updates.percentage !== undefined) {
      setEditPercentage(updates.percentage);
    }
    if (updates.expiresAt !== undefined) {
      setEditExpiresAt(updates.expiresAt);
    }
    if (updates.status !== undefined) {
      setEditStatus(updates.status);
    }
    if (updates.dishes !== undefined) {
      setEditDishes(updates.dishes);
    }
  }

  function updateCreateDiscount(updates: Partial<RestaurantDiscount>) {
    setCreateDiscount((currentDiscount) => ({
      ...currentDiscount,
      ...updates,
    }));
  }

  function getAvailableDishesToAdd(discount: RestaurantDiscount) {
    const selectedDishIds = new Set(discount.dishes.map((dish) => dish.id));

    return availableDishes.filter((dish) => !selectedDishIds.has(dish.id));
  }

  function startAddingDishRow(discount: RestaurantDiscount) {
    const nextAvailableDishes = getAvailableDishesToAdd(discount);

    if (nextAvailableDishes.length === 0) {
      setFormError("No quedan platos disponibles para agregar.");
      return;
    }

    setPendingDishId(nextAvailableDishes[0].id);
    setIsAddingDishRow(true);
    setFormError(null);
  }

  function cancelAddingDishRow() {
    setPendingDishId("");
    setIsAddingDishRow(false);
    setFormError(null);
  }

  function selectDiscount(discountId: string) {
    const nextSelectedDiscount =
      savedDiscounts.find((discount) => discount.id === discountId) ?? null;

    setDiscounts(savedDiscounts);
    setSelectedDiscountId(discountId);
    resetEditForm(nextSelectedDiscount);
    setPendingDishId("");
    setIsAddingDishRow(false);
    setShowCreateForm(false);
    setIsAddingDish(false);
    setIsSavingChanges(false);
    setIsDeletingDiscount(false);
    setMobileEditingDiscountId("");
    setFormError(null);
  }

  function handleFilterChange(nextFilter: DiscountFilter) {
    const nextFilteredDiscounts = getVisibleDiscounts(
      savedDiscounts,
      nextFilter,
      dishFilter,
      createdAfterFilter,
      createdBeforeFilter,
      sort,
    );
    const selectedDiscountIsVisible = nextFilteredDiscounts.some(
      (discount) => discount.id === selectedDiscountId,
    );

    setFilter(nextFilter);
    setDiscounts(savedDiscounts);

    if (selectedDiscountIsVisible) {
      const nextSelectedDiscount =
        savedDiscounts.find((discount) => discount.id === selectedDiscountId) ??
        null;

      resetEditForm(nextSelectedDiscount);
      setPendingDishId("");
      setIsAddingDishRow(false);
      setShowCreateForm(false);
      setCreateDiscount(createEmptyDiscount());
      setIsAddingDish(false);
      setIsSavingChanges(false);
      setIsDeletingDiscount(false);
      setMobileEditingDiscountId("");
      setFormError(null);
      return;
    }

    const nextDiscount = nextFilteredDiscounts[0] ?? null;
    setSelectedDiscountId(nextDiscount?.id ?? "");
    resetEditForm(nextDiscount);
    setPendingDishId("");
    setIsAddingDishRow(false);
    setShowCreateForm(!nextDiscount);
    setCreateDiscount(createEmptyDiscount());
    setIsAddingDish(false);
    setIsSavingChanges(false);
    setIsDeletingDiscount(false);
    setMobileEditingDiscountId("");
    setFormError(null);
  }

  function handleDishFilterChange(nextDishFilter: string) {
    const nextFilteredDiscounts = getVisibleDiscounts(
      savedDiscounts,
      filter,
      nextDishFilter,
      createdAfterFilter,
      createdBeforeFilter,
      sort,
    );
    const selectedDiscountIsVisible = nextFilteredDiscounts.some(
      (discount) => discount.id === selectedDiscountId,
    );

    setDishFilter(nextDishFilter);
    setDiscounts(savedDiscounts);

    if (selectedDiscountIsVisible) {
      const nextSelectedDiscount =
        savedDiscounts.find((discount) => discount.id === selectedDiscountId) ??
        null;

      resetEditForm(nextSelectedDiscount);
      setPendingDishId("");
      setIsAddingDishRow(false);
      setShowCreateForm(false);
      setCreateDiscount(createEmptyDiscount());
      setIsAddingDish(false);
      setIsSavingChanges(false);
      setIsDeletingDiscount(false);
      setMobileEditingDiscountId("");
      setFormError(null);
      return;
    }

    const nextDiscount = nextFilteredDiscounts[0] ?? null;
    setSelectedDiscountId(nextDiscount?.id ?? "");
    resetEditForm(nextDiscount);
    setPendingDishId("");
    setIsAddingDishRow(false);
    setShowCreateForm(!nextDiscount);
    setCreateDiscount(createEmptyDiscount());
    setIsAddingDish(false);
    setIsSavingChanges(false);
    setIsDeletingDiscount(false);
    setMobileEditingDiscountId("");
    setFormError(null);
  }

  function handleCreatedRangeFilterChange(
    nextCreatedAfterFilter: string,
    nextCreatedBeforeFilter: string,
  ) {
    const nextFilteredDiscounts = getVisibleDiscounts(
      savedDiscounts,
      filter,
      dishFilter,
      nextCreatedAfterFilter,
      nextCreatedBeforeFilter,
      sort,
    );
    const selectedDiscountIsVisible = nextFilteredDiscounts.some(
      (discount) => discount.id === selectedDiscountId,
    );

    setCreatedAfterFilter(nextCreatedAfterFilter);
    setCreatedBeforeFilter(nextCreatedBeforeFilter);
    setDiscounts(savedDiscounts);

    if (selectedDiscountIsVisible) {
      const nextSelectedDiscount =
        savedDiscounts.find((discount) => discount.id === selectedDiscountId) ??
        null;

      resetEditForm(nextSelectedDiscount);
      setPendingDishId("");
      setIsAddingDishRow(false);
      setShowCreateForm(false);
      setCreateDiscount(createEmptyDiscount());
      setIsAddingDish(false);
      setIsSavingChanges(false);
      setIsDeletingDiscount(false);
      setMobileEditingDiscountId("");
      setFormError(null);
      return;
    }

    const nextDiscount = nextFilteredDiscounts[0] ?? null;
    setSelectedDiscountId(nextDiscount?.id ?? "");
    resetEditForm(nextDiscount);
    setPendingDishId("");
    setIsAddingDishRow(false);
    setShowCreateForm(!nextDiscount);
    setCreateDiscount(createEmptyDiscount());
    setIsAddingDish(false);
    setIsSavingChanges(false);
    setIsDeletingDiscount(false);
    setMobileEditingDiscountId("");
    setFormError(null);
  }

  function handleSortChange(nextSort: DiscountSort) {
    const nextVisibleDiscounts = getVisibleDiscounts(
      savedDiscounts,
      filter,
      dishFilter,
      createdAfterFilter,
      createdBeforeFilter,
      nextSort,
    );
    const selectedDiscountIsVisible = nextVisibleDiscounts.some(
      (discount) => discount.id === selectedDiscountId,
    );

    setSort(nextSort);
    setDiscounts(savedDiscounts);

    if (selectedDiscountIsVisible) {
      return;
    }

    const nextDiscount = nextVisibleDiscounts[0] ?? null;
    setSelectedDiscountId(nextDiscount?.id ?? "");
    resetEditForm(nextDiscount);
    setPendingDishId("");
    setIsAddingDishRow(false);
    setShowCreateForm(!nextDiscount);
    setCreateDiscount(createEmptyDiscount());
    setIsAddingDish(false);
    setIsSavingChanges(false);
    setIsDeletingDiscount(false);
    setMobileEditingDiscountId("");
    setFormError(null);
  }

  function clearFilters() {
    const nextFilteredDiscounts = getVisibleDiscounts(
      savedDiscounts,
      "all",
      "",
      "",
      "",
      sort,
    );
    const selectedDiscountIsVisible = nextFilteredDiscounts.some(
      (discount) => discount.id === selectedDiscountId,
    );

    setFilter("all");
    setDishFilter("");
    setCreatedAfterFilter("");
    setCreatedBeforeFilter("");
    setDiscounts(savedDiscounts);

    if (selectedDiscountIsVisible) {
      return;
    }

    const nextDiscount = nextFilteredDiscounts[0] ?? null;
    setSelectedDiscountId(nextDiscount?.id ?? "");
    resetEditForm(nextDiscount);
    setPendingDishId("");
    setIsAddingDishRow(false);
    setShowCreateForm(!nextDiscount);
    setCreateDiscount(createEmptyDiscount());
    setIsAddingDish(false);
    setIsSavingChanges(false);
    setIsDeletingDiscount(false);
    setMobileEditingDiscountId("");
    setFormError(null);
  }

  function addDishToSelectedDiscount() {
    if (!editableSelectedDiscount) {
      setFormError("Selecciona un descuento para agregar platos.");
      return;
    }

    const dish = availableDishes.find(
      (availableDish) => availableDish.id === pendingDishId,
    );

    if (!dish) {
      setFormError("Selecciona un plato valido.");
      return;
    }

    if (editDishes.some((selectedDish) => selectedDish.id === dish.id)) {
      setFormError("Ese plato ya esta asociado al descuento.");
      return;
    }

    setFormError(null);
    setIsAddingDish(true);
    setIsAddingDishRow(false);
    setPendingDishId("");
    window.setTimeout(() => {
      setEditDishes((currentDishes) => [...currentDishes, dish]);
      setIsAddingDish(false);
    }, 300);
  }

  function addDishToCreateDiscount() {
    const dish = availableDishes.find(
      (availableDish) => availableDish.id === pendingDishId,
    );

    if (!dish) {
      setFormError("Selecciona un plato valido.");
      return;
    }

    if (createDiscount.dishes.some((selectedDish) => selectedDish.id === dish.id)) {
      setFormError("Ese plato ya esta asociado al descuento.");
      return;
    }

    setFormError(null);
    setIsAddingDish(true);
    setIsAddingDishRow(false);
    setPendingDishId("");
    window.setTimeout(() => {
      updateCreateDiscount({ dishes: [...createDiscount.dishes, dish] });
      setIsAddingDish(false);
    }, 300);
  }

  function removeDishFromSelectedDiscount(dishId: string) {
    if (!editableSelectedDiscount) {
      return;
    }

    setFormError(null);
    setEditDishes((currentDishes) =>
      currentDishes.filter((dish) => dish.id !== dishId),
    );
  }

  function removeDishFromCreateDiscount(dishId: string) {
    setFormError(null);
    updateCreateDiscount({
      dishes: createDiscount.dishes.filter((dish) => dish.id !== dishId),
    });
  }

  function handleCancelChanges() {
    if (!savedSelectedDiscount) {
      return;
    }

    resetEditForm(savedSelectedDiscount);
    setPendingDishId("");
    setIsAddingDishRow(false);
    setIsAddingDish(false);
    setIsSavingChanges(false);
    setIsDeletingDiscount(false);
    setFormError(null);
  }

  function handleCancelCreate() {
    setShowCreateForm(false);
    setCreateDiscount(createEmptyDiscount());
    setSelectedDiscountId(
      getVisibleDiscounts(
        discounts,
        filter,
        dishFilter,
        createdAfterFilter,
        createdBeforeFilter,
        sort,
      )[0]?.id ?? "",
    );
    setPendingDishId("");
    setIsAddingDishRow(false);
    setIsAddingDish(false);
    setIsSavingChanges(false);
    setIsDeletingDiscount(false);
    setMobileEditingDiscountId("");
    setFormError(null);
  }

  async function toggleSelectedDiscountStatus() {
    if (!editableSelectedDiscount) {
      return;
    }

    const nextStatus: DiscountStatus =
      editableSelectedDiscount.status === "active" ? "inactive" : "active";
    const nextDiscount = {
      ...editableSelectedDiscount,
      status: nextStatus,
    };
    const validationError = validateDiscountForm(nextDiscount);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setIsSavingChanges(true);
      setFormError(null);
      await updateRestaurantDiscount(nextDiscount);

      await refreshDiscountsData(filter, editableSelectedDiscount.id);
      setMobileEditingDiscountId("");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el estado del descuento. Intentalo nuevamente.",
      );
    } finally {
      setIsSavingChanges(false);
    }
  }

  function validateDiscountForm(discount: RestaurantDiscount) {
    if (
      !Number.isFinite(discount.percentage) ||
      discount.percentage < 1 ||
      discount.percentage > 100
    ) {
      return "El porcentaje debe estar entre 1 y 100.";
    }

    if (!discount.expiresAt.trim()) {
      return "La fecha de vencimiento es obligatoria.";
    }

    if (discount.dishes.length === 0) {
      return "El descuento debe tener al menos un plato asociado.";
    }

    return null;
  }

  async function handleCreateDiscount() {
    const validationError = validateDiscountForm(createDiscount);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setIsSavingChanges(true);
      setFormError(null);
      await createRestaurantDiscount(createDiscount);
      setShowCreateForm(false);
      await refreshDiscountsData(filter);
      setMobileEditingDiscountId("");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudo crear el descuento. Intentalo nuevamente.",
      );
    } finally {
      setIsAddingDish(false);
      setIsSavingChanges(false);
    }
  }

  async function handleSaveChanges() {
    if (!editableSelectedDiscount) {
      setFormError("Selecciona un descuento para guardar cambios.");
      return;
    }

    const validationError = validateDiscountForm(editableSelectedDiscount);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setIsSavingChanges(true);
      setFormError(null);
      await updateRestaurantDiscount(editableSelectedDiscount);

      await refreshDiscountsData(filter);
      setMobileEditingDiscountId("");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los cambios. Intentalo nuevamente.",
      );
    } finally {
      setIsAddingDish(false);
      setIsSavingChanges(false);
    }
  }

  async function handleDeleteDiscount() {
    if (!selectedDiscount) {
      setFormError("Selecciona un descuento para eliminar.");
      return;
    }

    await deleteDiscountAndReloadList(selectedDiscount.id);
  }

  async function handleDeleteDiscountById(discountId: string) {
    await deleteDiscountAndReloadList(discountId);
  }

  async function deleteDiscountAndReloadList(discountId: string) {
    try {
      setIsDeletingDiscount(true);
      setFormError(null);
      await deleteRestaurantDiscount(discountId);
      await refreshDiscountsData(filter);
      setMobileEditingDiscountId("");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el descuento. Intentalo nuevamente.",
      );
    } finally {
      setIsDeletingDiscount(false);
    }
  }

  const isDataReady = Boolean(loadedData) && !isLoading && !loadError;
  const loadErrorMessage =
    loadError?.message ?? "No se pudieron cargar los descuentos.";
  const hasActiveFilters =
    Boolean(dishFilter) ||
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
              <label htmlFor="discount-sort-mobile" className="sr-only">
                Orden
              </label>
              <select
                id="discount-sort-mobile"
                value={sort}
                disabled={!isDataReady}
                onChange={(event) =>
                  handleSortChange(event.target.value as DiscountSort)
                }
                className="h-11 w-[125px] rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
              >
                <option value="created-desc">Mas nuevos</option>
                <option value="created-asc">Mas antiguos</option>
                <option value="percentage-desc">Mas descuento</option>
                <option value="percentage-asc">Menos descuento</option>
                <option value="expires-desc">Vencen despues</option>
                <option value="expires-asc">Vencen antes</option>
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
                      Ajusta el listado de descuentos visible.
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
                  <label htmlFor="discount-dish-filter-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Plato
                    </span>
                    <input
                      id="discount-dish-filter-mobile"
                      type="search"
                      value={dishFilter}
                      disabled={!isDataReady}
                      onChange={(event) =>
                        handleDishFilterChange(event.target.value)
                      }
                      placeholder="Buscar plato"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20"
                    />
                  </label>

                  <label htmlFor="discount-created-after-filter-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Creado despues de
                    </span>
                    <input
                      id="discount-created-after-filter-mobile"
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

                  <label htmlFor="discount-created-before-filter-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Creado antes de
                    </span>
                    <input
                      id="discount-created-before-filter-mobile"
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

                  <label htmlFor="discount-status-filter-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Estado
                    </span>
                    <select
                      id="discount-status-filter-mobile"
                      value={filter}
                      disabled={!isDataReady}
                      onChange={(event) =>
                        handleFilterChange(event.target.value as DiscountFilter)
                      }
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                    >
                      <option value="all">Todos</option>
                      <option value="active">Activos</option>
                      <option value="inactive">Inactivos</option>
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
          <div className="grid gap-4 xl:grid-cols-[240px_190px_190px_150px_auto] xl:items-end">
            <label htmlFor="discount-dish-filter" className="block">
              <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                Plato
              </span>
              <input
                id="discount-dish-filter"
                type="search"
                value={dishFilter}
                disabled={!isDataReady}
                onChange={(event) => handleDishFilterChange(event.target.value)}
                placeholder="Buscar plato"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20"
              />
            </label>

            <label htmlFor="discount-created-after-filter" className="block">
              <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                Creado despues de
              </span>
              <input
                id="discount-created-after-filter"
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

            <label htmlFor="discount-created-before-filter" className="block">
              <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                Creado antes de
              </span>
              <input
                id="discount-created-before-filter"
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

            <label htmlFor="discount-status-filter" className="block">
              <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                Estado
              </span>
              <select
                id="discount-status-filter"
                value={filter}
                disabled={!isDataReady}
                onChange={(event) =>
                  handleFilterChange(event.target.value as DiscountFilter)
                }
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
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

          <label htmlFor="discount-sort" className="block w-full xl:w-[180px]">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Orden
            </span>
            <select
              id="discount-sort"
              value={sort}
              disabled={!isDataReady}
              onChange={(event) =>
                handleSortChange(event.target.value as DiscountSort)
              }
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              <option value="created-desc">Mas nuevos</option>
              <option value="created-asc">Mas antiguos</option>
              <option value="percentage-desc">Mas descuento</option>
              <option value="percentage-asc">Menos descuento</option>
              <option value="expires-desc">Vencen despues</option>
              <option value="expires-asc">Vencen antes</option>
            </select>
          </label>
        </div>
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
              onClick={showNewDiscountForm}
              disabled={!isDataReady}
              className="flex h-11 w-fit cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlusIcon className="h-5 w-5" />
              Nuevo descuento
            </button>
          </div>

          <div className="space-y-4 p-3">
            {isLoading ? (
              <div className="py-8">
                <LoadingIndicator label="Cargando listado de descuentos..." />
              </div>
            ) : loadError ? (
              <PanelError message={loadErrorMessage} onRetry={reload} />
            ) : filteredDiscounts.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
                No hay descuentos para mostrar.
              </p>
            ) : null}
            {isDataReady && filteredDiscounts.map((discount) => {
              const isSelected =
                discount.id === selectedDiscount?.id && !showCreateForm;

              const isEditingInline =
                mobileEditingDiscountId === discount.id &&
                editableSelectedDiscount?.id === discount.id;

              return (
                <article
                  key={discount.id}
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
                      onClick={() => selectDiscount(discount.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          selectDiscount(discount.id);
                        }
                      }}
                      className="grid w-full cursor-pointer grid-cols-[96px_minmax(0,1fr)] gap-4 p-4 text-left sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-start"
                    >
                      <div className="col-start-1 row-start-1 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-3xl font-black text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                        {discount.percentage}%
                      </div>
                      <div className="col-start-2 row-start-1 flex items-start justify-end gap-2 sm:col-start-3">
                        <StatusBadge status={discount.status} />
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            selectDiscount(discount.id);
                            setMobileEditingDiscountId(discount.id);
                          }}
                          aria-label="Editar descuento"
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-gray-100 transition hover:text-orange-600 xl:hidden dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800 dark:hover:text-orange-400"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDeleteDiscountById(discount.id);
                          }}
                          disabled={isDeletingDiscount}
                          aria-label="Eliminar descuento"
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-white text-red-500 shadow-sm ring-1 ring-gray-100 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 xl:hidden dark:bg-slate-950 dark:text-red-400 dark:ring-slate-800 dark:hover:bg-red-500/10"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                        <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                          {getDiscountTitle(discount)}
                        </h3>
                        <p className="mt-2 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-slate-500 dark:text-slate-400">
                          {getDishSummary(discount)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            Creado: {formatDateTimeLabel(discount.createdAt)}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            Vence: {formatDateTimeLabel(discount.expiresAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isEditingInline && (
                    <div className="space-y-4 p-4 xl:hidden">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                            Porcentaje
                          </span>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={editPercentage}
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
                            Fecha de vencimiento
                          </span>
                          <input
                            type="datetime-local"
                            value={editExpiresAt}
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
                          {editDishes.length === 0 && !isAddingDishRow ? (
                            <p className="px-4 py-4 text-sm font-medium text-slate-400 dark:text-slate-500">
                              No hay platos asociados.
                            </p>
                          ) : null}
                          {editDishes.map((dish) => (
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
                          {isAddingDishRow ? (
                            <div className="grid gap-3 border-b border-gray-100 px-4 py-4 last:border-b-0 dark:border-slate-800">
                              <select
                                value={pendingDishId}
                                onChange={(event) => setPendingDishId(event.target.value)}
                                className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                              >
                                {getAvailableDishesToAdd(editableSelectedDiscount).map((dish) => (
                                  <option key={dish.id} value={dish.id}>
                                    {dish.name}
                                  </option>
                                ))}
                              </select>
                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={addDishToSelectedDiscount}
                                  disabled={isAddingDish || isSavingChanges || isDeletingDiscount}
                                  aria-label="Confirmar plato"
                                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                                >
                                  <CheckIcon className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelAddingDishRow}
                                  disabled={isAddingDish || isSavingChanges || isDeletingDiscount}
                                  aria-label="Cancelar plato"
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
                          onClick={() => startAddingDishRow(editableSelectedDiscount)}
                          disabled={isAddingDishRow || isSavingChanges || isDeletingDiscount}
                          className="mt-3 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-50 px-5 text-sm font-extrabold text-orange-600 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
                        >
                          <PlusIcon className="h-5 w-5" />
                          Agregar plato
                        </button>
                      </div>

                      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            handleCancelChanges();
                            setMobileEditingDiscountId("");
                          }}
                          className="h-11 cursor-pointer rounded-xl bg-slate-100 px-5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={toggleSelectedDiscountStatus}
                          disabled={isSavingChanges || isDeletingDiscount}
                          className="h-11 cursor-pointer rounded-xl bg-orange-50 px-5 text-sm font-extrabold text-orange-600 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
                        >
                          {isSavingChanges
                            ? "Marcando..."
                            : editStatus === "inactive"
                              ? "Marcar activo"
                              : "Marcar inactivo"}
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveChanges}
                          disabled={isSavingChanges || isDeletingDiscount}
                          className="h-11 cursor-pointer rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSavingChanges ? "Guardando..." : "Guardar cambios"}
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
                Detalle del descuento
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Los datos del descuento se cargan en segundo plano.
              </p>
            </div>
            <div className="p-5 py-10">
              <LoadingIndicator label="Cargando detalle de descuentos..." />
            </div>
          </section>
        )}

        {loadError && (
          <section className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm xl:block dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Detalle del descuento
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

        {isDataReady && showCreateForm && (
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                  Nuevo descuento
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Completa los datos para dar de alta un nuevo descuento.
                </p>
              </div>
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
                    value={createDiscount.percentage}
                    onChange={(event) =>
                      updateCreateDiscount({
                        percentage: Number(event.target.value),
                      })
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Fecha de vencimiento
                  </span>
                  <input
                    type="datetime-local"
                    value={createDiscount.expiresAt}
                    onChange={(event) =>
                      updateCreateDiscount({ expiresAt: event.target.value })
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Estado
                  </span>
                  <div className="flex h-11 w-full items-center rounded-xl border border-gray-200 bg-slate-50 px-4 dark:border-slate-800 dark:bg-slate-950">
                    <StatusBadge status={editStatus} />
                  </div>
                </label>
              </div>

              <div>
                <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  Platos asociados
                </span>

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
                  {createDiscount.dishes.length === 0 && !isAddingDishRow ? (
                    <p className="px-4 py-4 text-sm font-medium text-slate-400 dark:text-slate-500">
                      No hay platos asociados.
                    </p>
                  ) : null}
                  {createDiscount.dishes.map((dish) => (
                    <div
                      key={dish.id}
                      className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 text-sm font-extrabold text-slate-800 last:border-b-0 dark:border-slate-800 dark:text-slate-100"
                    >
                      <span className="min-w-0 truncate">{dish.name}</span>
                      <button
                        type="button"
                        onClick={() => removeDishFromCreateDiscount(dish.id)}
                        aria-label={`Quitar ${dish.name}`}
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {isAddingDishRow ? (
                    <div className="grid gap-3 border-b border-gray-100 px-4 py-4 last:border-b-0 dark:border-slate-800">
                      <select
                        value={pendingDishId}
                        onChange={(event) => setPendingDishId(event.target.value)}
                        className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                      >
                        {getAvailableDishesToAdd(createDiscount).map((dish) => (
                          <option key={dish.id} value={dish.id}>
                            {dish.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={addDishToCreateDiscount}
                          disabled={isAddingDish || isSavingChanges}
                          aria-label="Confirmar plato"
                          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelAddingDishRow}
                          disabled={isAddingDish || isSavingChanges}
                          aria-label="Cancelar plato"
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
                  onClick={() => startAddingDishRow(createDiscount)}
                  disabled={isAddingDishRow || isSavingChanges}
                  className="mt-3 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-50 px-5 text-sm font-extrabold text-orange-600 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
                >
                  <PlusIcon className="h-5 w-5" />
                  Agregar plato
                </button>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-5 py-5 sm:flex-row sm:justify-end dark:border-slate-800">
              <button
                type="button"
                onClick={handleCancelCreate}
                disabled={isSavingChanges}
                className="h-11 cursor-pointer rounded-xl bg-slate-100 px-5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateDiscount}
                disabled={isSavingChanges}
                className="h-11 cursor-pointer rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingChanges ? "Creando..." : "Crear descuento"}
              </button>
            </div>
          </section>
        )}

        {isDataReady && !showCreateForm && selectedDiscount && editableSelectedDiscount && (
          <section className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm xl:block dark:border-slate-800 dark:bg-slate-900">
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
                onClick={handleDeleteDiscount}
                disabled={isSavingChanges || isDeletingDiscount}
                className="hidden h-10 cursor-pointer items-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-extrabold text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:flex dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
              >
                <TrashIcon className="h-4 w-4" />
                {isDeletingDiscount ? "Eliminando..." : "Eliminar"}
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
                    value={editPercentage}
                    onChange={(event) =>
                      updateSelectedDiscount({
                        percentage: Number(event.target.value),
                      })
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Fecha de creacion
                  </span>
                  <div className="flex h-11 w-full items-center rounded-xl border border-gray-200 bg-slate-50 px-4 text-sm font-extrabold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                    {formatDateTimeLabel(selectedDiscount.createdAt)}
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Fecha de vencimiento
                  </span>
                  <input
                    type="datetime-local"
                    value={editExpiresAt}
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
                  {editDishes.length === 0 && !isAddingDishRow ? (
                    <p className="px-4 py-4 text-sm font-medium text-slate-400 dark:text-slate-500">
                      No hay platos asociados.
                    </p>
                  ) : null}
                  {editDishes.map((dish) => (
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
                  {isAddingDishRow ? (
                    <div className="grid gap-3 border-b border-gray-100 px-4 py-4 last:border-b-0 dark:border-slate-800">
                      <select
                        value={pendingDishId}
                        onChange={(event) => setPendingDishId(event.target.value)}
                        className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                      >
                        {getAvailableDishesToAdd(editableSelectedDiscount).map((dish) => (
                          <option key={dish.id} value={dish.id}>
                            {dish.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={addDishToSelectedDiscount}
                          disabled={isAddingDish || isSavingChanges || isDeletingDiscount}
                          aria-label="Confirmar plato"
                          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelAddingDishRow}
                          disabled={isAddingDish || isSavingChanges || isDeletingDiscount}
                          aria-label="Cancelar plato"
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
                  onClick={() => startAddingDishRow(editableSelectedDiscount)}
                  disabled={isAddingDishRow || isSavingChanges || isDeletingDiscount}
                  className="mt-3 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-50 px-5 text-sm font-extrabold text-orange-600 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
                >
                  <PlusIcon className="h-5 w-5" />
                  Agregar plato
                </button>
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
                onClick={toggleSelectedDiscountStatus}
                disabled={isSavingChanges || isDeletingDiscount}
                className="h-11 cursor-pointer rounded-xl bg-orange-50 px-5 text-sm font-extrabold text-orange-600 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
              >
                {isSavingChanges
                  ? "Marcando..."
                  : editStatus === "inactive"
                    ? "Marcar activo"
                    : "Marcar inactivo"}
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={isSavingChanges || isDeletingDiscount}
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
