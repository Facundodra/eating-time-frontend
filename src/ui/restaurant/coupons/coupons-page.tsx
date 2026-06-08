"use client";

import {
  CheckIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";

import { useAsyncData } from "@/hooks/shared/use-async-data";
import type {
  CouponDish,
  CouponStatus,
  RestaurantCoupon,
  RestaurantCouponsResponse,
} from "@/lib/restaurant/coupon/types";
import {
  createRestaurantCoupon,
  deleteRestaurantCoupon,
  getRestaurantCoupons,
  updateRestaurantCoupon,
} from "@/services/restaurant/coupon-service";
import { getCurrentSession } from "@/services/shared/auth-service";
import LoadingIndicator from "@/ui/shared/feedback/loading-indicator";
import PanelError from "@/ui/shared/feedback/panel-error";

type CouponFilter = "all" | CouponStatus;

const NEW_COUPON_ID = "new-coupon";

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

function createEmptyCoupon(): RestaurantCoupon {
  return {
    id: NEW_COUPON_ID,
    code: "",
    description: "",
    percentage: 10,
    status: "active",
    createdAt: "Nuevo",
    expiresAt: getDefaultExpiration(),
    dishes: [],
    isNew: true,
  };
}

function areDishesEqual(
  currentDishes: RestaurantCoupon["dishes"],
  initialDishes: RestaurantCoupon["dishes"],
) {
  if (currentDishes.length !== initialDishes.length) {
    return false;
  }

  const currentIds = currentDishes.map((dish) => dish.id).sort();
  const initialIds = initialDishes.map((dish) => dish.id).sort();

  return currentIds.every((id, index) => id === initialIds[index]);
}

function filterCoupons(coupons: RestaurantCoupon[], filter: CouponFilter) {
  if (filter === "all") {
    return coupons;
  }

  return coupons.filter((coupon) => coupon.status === filter);
}

function StatusBadge({ status }: { status: CouponStatus }) {
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

function DishRows({
  availableDishes,
  disabled,
  dishes,
  isAddingDish,
  isAddingDishRow,
  onAdd,
  onCancel,
  onConfirm,
  onPendingChange,
  onRemove,
  pendingDishId,
}: {
  availableDishes: CouponDish[];
  disabled: boolean;
  dishes: CouponDish[];
  isAddingDish: boolean;
  isAddingDishRow: boolean;
  onAdd: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onPendingChange: (dishId: string) => void;
  onRemove: (dishId: string) => void;
  pendingDishId: string;
}) {
  const selectedDishIds = new Set(dishes.map((dish) => dish.id));
  const dishesToAdd = availableDishes.filter(
    (dish) => !selectedDishIds.has(dish.id),
  );

  return (
    <>
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800">
        {dishes.length === 0 && !isAddingDishRow ? (
          <p className="px-4 py-4 text-sm font-medium text-slate-400 dark:text-slate-500">
            No hay platos asociados.
          </p>
        ) : null}
        {dishes.map((dish) => (
          <div
            key={dish.id}
            className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 text-sm font-extrabold text-slate-800 last:border-b-0 dark:border-slate-800 dark:text-slate-100"
          >
            <span className="min-w-0 truncate">{dish.name}</span>
            <button
              type="button"
              onClick={() => onRemove(dish.id)}
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
              onChange={(event) => onPendingChange(event.target.value)}
              className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              {dishesToAdd.map((dish) => (
                <option key={dish.id} value={dish.id}>
                  {dish.name}
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onConfirm}
                disabled={isAddingDish || disabled}
                aria-label="Confirmar plato"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={isAddingDish || disabled}
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
        onClick={onAdd}
        disabled={isAddingDishRow || disabled}
        className="mt-3 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-50 px-5 text-sm font-extrabold text-orange-600 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
      >
        <PlusIcon className="h-5 w-5" />
        Agregar plato
      </button>
    </>
  );
}

async function loadRestaurantCoupons(): Promise<RestaurantCouponsResponse> {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error("No se encontro una sesion activa.");
  }

  return getRestaurantCoupons(String(session.idTipoUsuario));
}

export default function RestaurantCouponsPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [filter, setFilter] = useState<CouponFilter>("all");
  const [coupons, setCoupons] = useState<RestaurantCoupon[]>([]);
  const [savedCoupons, setSavedCoupons] = useState<RestaurantCoupon[]>([]);
  const [availableDishes, setAvailableDishes] = useState<CouponDish[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState("");
  const [pendingDishId, setPendingDishId] = useState("");
  const [isAddingDishRow, setIsAddingDishRow] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createCoupon, setCreateCoupon] =
    useState<RestaurantCoupon>(createEmptyCoupon);
  const [editCode, setEditCode] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPercentage, setEditPercentage] = useState(0);
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [editStatus, setEditStatus] = useState<CouponStatus>("active");
  const [editDishes, setEditDishes] = useState<CouponDish[]>([]);
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [isDeletingCoupon, setIsDeletingCoupon] = useState(false);
  const [mobileEditingCouponId, setMobileEditingCouponId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const {
    data: loadedData,
    error: loadError,
    isLoading,
    reload,
  } = useAsyncData(loadRestaurantCoupons, {
    onSuccess: (data) => applyCouponsData(data, filter),
  });

  useEffect(() => {
    if (!formError) {
      return;
    }

    const timeoutId = window.setTimeout(() => setFormError(null), 5000);

    return () => window.clearTimeout(timeoutId);
  }, [formError]);

  const filteredCoupons = useMemo(() => {
    return filterCoupons(coupons, filter);
  }, [coupons, filter]);

  const selectedCoupon =
    filteredCoupons.find((coupon) => coupon.id === selectedCouponId) ??
    filteredCoupons[0] ??
    null;
  const savedSelectedCoupon = savedCoupons.find(
    (coupon) => coupon.id === selectedCoupon?.id,
  );
  const editableSelectedCoupon = selectedCoupon
    ? {
        ...selectedCoupon,
        code: editCode,
        description: editDescription,
        percentage: editPercentage,
        status: editStatus,
        expiresAt: editExpiresAt,
        dishes: editDishes,
      }
    : null;
  const hasSelectedCouponChanges =
    Boolean(selectedCoupon && savedSelectedCoupon) &&
    (editCode !== savedSelectedCoupon?.code ||
      editDescription !== savedSelectedCoupon?.description ||
      editPercentage !== savedSelectedCoupon?.percentage ||
      editStatus !== savedSelectedCoupon?.status ||
      editExpiresAt !== savedSelectedCoupon?.expiresAt ||
      !areDishesEqual(editDishes, savedSelectedCoupon?.dishes ?? []));

  function resetEditForm(coupon: RestaurantCoupon | null) {
    setEditCode(coupon?.code ?? "");
    setEditDescription(coupon?.description ?? "");
    setEditPercentage(coupon?.percentage ?? 0);
    setEditExpiresAt(coupon?.expiresAt ?? "");
    setEditStatus(coupon?.status ?? "active");
    setEditDishes(coupon?.dishes ?? []);
  }

  function applyCouponsData(
    nextData: RestaurantCouponsResponse,
    currentFilter: CouponFilter,
  ) {
    const nextSelectedCoupon =
      filterCoupons(nextData.coupons, currentFilter)[0] ?? null;

    setRestaurantId(nextData.restaurantId);
    setAvailableDishes(nextData.availableDishes);
    setCoupons(nextData.coupons);
    setSavedCoupons(nextData.coupons);
    setSelectedCouponId(nextSelectedCoupon?.id ?? "");
    resetEditForm(nextSelectedCoupon);
    setPendingDishId("");
    setIsAddingDishRow(false);
    setShowCreateForm(!nextSelectedCoupon);
    setCreateCoupon(createEmptyCoupon());
    setIsAddingDish(false);
    setIsSavingChanges(false);
    setIsDeletingCoupon(false);
    setMobileEditingCouponId("");
    setFormError(null);
  }

  async function refreshCouponsData(currentFilter: CouponFilter) {
    if (!restaurantId) {
      throw new Error("No se encontro el local para recargar cupones.");
    }

    const freshData = await getRestaurantCoupons(restaurantId);
    applyCouponsData(freshData, currentFilter);
  }

  function updateCreateCoupon(updates: Partial<RestaurantCoupon>) {
    setCreateCoupon((currentCoupon) => ({
      ...currentCoupon,
      ...updates,
    }));
  }

  function updateSelectedCoupon(updates: Partial<RestaurantCoupon>) {
    if (updates.code !== undefined) setEditCode(updates.code);
    if (updates.description !== undefined) {
      setEditDescription(updates.description);
    }
    if (updates.percentage !== undefined) setEditPercentage(updates.percentage);
    if (updates.expiresAt !== undefined) setEditExpiresAt(updates.expiresAt);
    if (updates.status !== undefined) setEditStatus(updates.status);
    if (updates.dishes !== undefined) setEditDishes(updates.dishes);
  }

  function getAvailableDishesToAdd(coupon: RestaurantCoupon) {
    const selectedDishIds = new Set(coupon.dishes.map((dish) => dish.id));
    return availableDishes.filter((dish) => !selectedDishIds.has(dish.id));
  }

  function startAddingDishRow(coupon: RestaurantCoupon) {
    const nextAvailableDishes = getAvailableDishesToAdd(coupon);

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

  function showNewCouponForm() {
    setCoupons(savedCoupons);
    resetEditForm(null);
    setShowCreateForm(true);
    setSelectedCouponId("");
    setCreateCoupon(createEmptyCoupon());
    setPendingDishId("");
    setIsAddingDishRow(false);
    setIsAddingDish(false);
    setIsSavingChanges(false);
    setIsDeletingCoupon(false);
    setMobileEditingCouponId("");
    setFormError(null);
  }

  function selectCoupon(couponId: string) {
    const nextSelectedCoupon =
      savedCoupons.find((coupon) => coupon.id === couponId) ?? null;

    setCoupons(savedCoupons);
    setSelectedCouponId(couponId);
    resetEditForm(nextSelectedCoupon);
    setPendingDishId("");
    setIsAddingDishRow(false);
    setShowCreateForm(false);
    setIsAddingDish(false);
    setIsSavingChanges(false);
    setIsDeletingCoupon(false);
    setMobileEditingCouponId("");
    setFormError(null);
  }

  function handleFilterChange(nextFilter: CouponFilter) {
    const nextFilteredCoupons = filterCoupons(savedCoupons, nextFilter);
    const selectedCouponIsVisible = nextFilteredCoupons.some(
      (coupon) => coupon.id === selectedCouponId,
    );

    setFilter(nextFilter);
    setCoupons(savedCoupons);

    if (selectedCouponIsVisible) {
      const nextSelectedCoupon =
        savedCoupons.find((coupon) => coupon.id === selectedCouponId) ?? null;

      resetEditForm(nextSelectedCoupon);
      setPendingDishId("");
      setIsAddingDishRow(false);
      setShowCreateForm(false);
      setCreateCoupon(createEmptyCoupon());
      setIsAddingDish(false);
      setIsSavingChanges(false);
      setIsDeletingCoupon(false);
      setMobileEditingCouponId("");
      setFormError(null);
      return;
    }

    const nextCoupon = nextFilteredCoupons[0] ?? null;
    setSelectedCouponId(nextCoupon?.id ?? "");
    resetEditForm(nextCoupon);
    setPendingDishId("");
    setIsAddingDishRow(false);
    setShowCreateForm(!nextCoupon);
    setCreateCoupon(createEmptyCoupon());
    setIsAddingDish(false);
    setIsSavingChanges(false);
    setIsDeletingCoupon(false);
    setMobileEditingCouponId("");
    setFormError(null);
  }

  function addDishToCreateCoupon() {
    const dish = availableDishes.find(
      (availableDish) => availableDish.id === pendingDishId,
    );

    if (!dish) {
      setFormError("Selecciona un plato valido.");
      return;
    }

    if (createCoupon.dishes.some((selectedDish) => selectedDish.id === dish.id)) {
      setFormError("Ese plato ya esta asociado al cupon.");
      return;
    }

    setFormError(null);
    setIsAddingDish(true);
    setIsAddingDishRow(false);
    setPendingDishId("");
    window.setTimeout(() => {
      updateCreateCoupon({ dishes: [...createCoupon.dishes, dish] });
      setIsAddingDish(false);
    }, 300);
  }

  function addDishToSelectedCoupon() {
    if (!editableSelectedCoupon) {
      setFormError("Selecciona un cupon para agregar platos.");
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
      setFormError("Ese plato ya esta asociado al cupon.");
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

  function removeDishFromCreateCoupon(dishId: string) {
    setFormError(null);
    updateCreateCoupon({
      dishes: createCoupon.dishes.filter((dish) => dish.id !== dishId),
    });
  }

  function removeDishFromSelectedCoupon(dishId: string) {
    setFormError(null);
    setEditDishes((currentDishes) =>
      currentDishes.filter((dish) => dish.id !== dishId),
    );
  }

  function handleCancelChanges() {
    if (!savedSelectedCoupon) {
      return;
    }

    resetEditForm(savedSelectedCoupon);
    setPendingDishId("");
    setIsAddingDishRow(false);
    setIsAddingDish(false);
    setIsSavingChanges(false);
    setIsDeletingCoupon(false);
    setFormError(null);
  }

  function handleCancelCreate() {
    setShowCreateForm(false);
    setCreateCoupon(createEmptyCoupon());
    setSelectedCouponId(filterCoupons(coupons, filter)[0]?.id ?? "");
    setPendingDishId("");
    setIsAddingDishRow(false);
    setIsAddingDish(false);
    setIsSavingChanges(false);
    setIsDeletingCoupon(false);
    setMobileEditingCouponId("");
    setFormError(null);
  }

  async function toggleSelectedCouponStatus() {
    if (!editableSelectedCoupon) {
      return;
    }

    const nextStatus: CouponStatus =
      editableSelectedCoupon.status === "active" ? "inactive" : "active";
    const nextCoupon = {
      ...editableSelectedCoupon,
      status: nextStatus,
    };
    const validationError = validateCouponForm(nextCoupon);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setIsSavingChanges(true);
      setFormError(null);
      await updateRestaurantCoupon(restaurantId, nextCoupon);
      setFilter("all");
      await refreshCouponsData("all");
      setMobileEditingCouponId("");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el estado del cupon. Intentalo nuevamente.",
      );
    } finally {
      setIsSavingChanges(false);
    }
  }

  function validateCouponForm(coupon: RestaurantCoupon) {
    if (!coupon.code.trim()) return "El codigo es obligatorio.";
    if (!coupon.description.trim()) return "La descripcion es obligatoria.";
    if (
      !Number.isFinite(coupon.percentage) ||
      coupon.percentage < 1 ||
      coupon.percentage > 100
    ) {
      return "El porcentaje debe estar entre 1 y 100.";
    }
    if (!coupon.expiresAt.trim()) {
      return "La fecha de vencimiento es obligatoria.";
    }
    if (coupon.dishes.length === 0) {
      return "El cupon debe tener al menos un plato asociado.";
    }

    return null;
  }

  async function handleCreateCoupon() {
    const validationError = validateCouponForm(createCoupon);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setIsSavingChanges(true);
      setFormError(null);
      await createRestaurantCoupon(restaurantId, createCoupon);
      setShowCreateForm(false);
      await refreshCouponsData(filter);
      setMobileEditingCouponId("");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudo crear el cupon. Intentalo nuevamente.",
      );
    } finally {
      setIsAddingDish(false);
      setIsSavingChanges(false);
    }
  }

  async function handleSaveChanges() {
    if (!editableSelectedCoupon) {
      setFormError("Selecciona un cupon para guardar cambios.");
      return;
    }

    const validationError = validateCouponForm(editableSelectedCoupon);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setIsSavingChanges(true);
      setFormError(null);
      await updateRestaurantCoupon(restaurantId, editableSelectedCoupon);

      await refreshCouponsData(filter);
      setMobileEditingCouponId("");
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

  async function handleDeleteCoupon() {
    if (!selectedCoupon) {
      setFormError("Selecciona un cupon para eliminar.");
      return;
    }

    await deleteCouponAndReloadList(selectedCoupon.id);
  }

  async function handleDeleteCouponById(couponId: string) {
    await deleteCouponAndReloadList(couponId);
  }

  async function deleteCouponAndReloadList(couponId: string) {
    try {
      setIsDeletingCoupon(true);
      setFormError(null);
      await deleteRestaurantCoupon(restaurantId, couponId);
      await refreshCouponsData(filter);
      setMobileEditingCouponId("");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el cupon. Intentalo nuevamente.",
      );
    } finally {
      setIsDeletingCoupon(false);
    }
  }

  const isDataReady = Boolean(loadedData) && !isLoading && !loadError;
  const loadErrorMessage =
    loadError?.message ?? "No se pudieron cargar los cupones.";

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label htmlFor="coupon-status-filter" className="block max-w-[180px]">
          <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
            Estado
          </span>
          <select
            id="coupon-status-filter"
            value={filter}
            disabled={!isDataReady}
            onChange={(event) =>
              handleFilterChange(event.target.value as CouponFilter)
            }
            className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
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
                Listado de cupones
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Selecciona un cupon para ver sus datos o darlo de baja.
              </p>
            </div>
            <button
              type="button"
              onClick={showNewCouponForm}
              disabled={!isDataReady}
              className="flex h-11 w-fit cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlusIcon className="h-5 w-5" />
              Nuevo cupon
            </button>
          </div>

          <div className="space-y-4 p-3">
            {isLoading ? (
              <div className="py-8">
                <LoadingIndicator label="Cargando listado de cupones..." />
              </div>
            ) : loadError ? (
              <PanelError message={loadErrorMessage} onRetry={reload} />
            ) : filteredCoupons.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
                No hay cupones para mostrar.
              </p>
            ) : null}
            {isDataReady && filteredCoupons.map((coupon) => {
              const isSelected =
                coupon.id === selectedCoupon?.id && !showCreateForm;
              const isEditingInline =
                mobileEditingCouponId === coupon.id &&
                editableSelectedCoupon?.id === coupon.id;

              return (
                <article
                  key={coupon.id}
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
                      onClick={() => selectCoupon(coupon.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          selectCoupon(coupon.id);
                        }
                      }}
                      className="grid w-full cursor-pointer grid-cols-[96px_minmax(0,1fr)] gap-4 p-4 text-left sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-start"
                    >
                      <div className="col-start-1 row-start-1 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-3xl font-black text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                        {coupon.percentage}%
                      </div>
                      <div className="col-start-2 row-start-1 flex items-start justify-end gap-2 sm:col-start-3">
                        <StatusBadge status={coupon.status} />
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            selectCoupon(coupon.id);
                            setMobileEditingCouponId(coupon.id);
                          }}
                          aria-label="Editar cupon"
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-gray-100 transition hover:text-orange-600 xl:hidden dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800 dark:hover:text-orange-400"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDeleteCouponById(coupon.id);
                          }}
                          disabled={isDeletingCoupon}
                          aria-label="Eliminar cupon"
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-white text-red-500 shadow-sm ring-1 ring-gray-100 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 xl:hidden dark:bg-slate-950 dark:text-red-400 dark:ring-slate-800 dark:hover:bg-red-500/10"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                        <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                          {coupon.code}
                        </h3>
                        <p className="mt-2 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-slate-500 dark:text-slate-400">
                          {coupon.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            Creado: {formatDateTimeLabel(coupon.createdAt)}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            Vence: {formatDateTimeLabel(coupon.expiresAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isEditingInline && editableSelectedCoupon && (
                    <CouponFormPanel
                      availableDishes={availableDishes}
                      coupon={editableSelectedCoupon}
                      error={formError}
                      hasChanges={hasSelectedCouponChanges}
                      isAddingDish={isAddingDish}
                      isAddingDishRow={isAddingDishRow}
                      isDeleting={isDeletingCoupon}
                      isSaving={isSavingChanges}
                      mode="edit"
                      onAddDish={() => startAddingDishRow(editableSelectedCoupon)}
                      onCancel={() => {
                        handleCancelChanges();
                        setMobileEditingCouponId("");
                      }}
                      onCancelDish={cancelAddingDishRow}
                      onChange={updateSelectedCoupon}
                      onCloseError={() => setFormError(null)}
                      onConfirmDish={addDishToSelectedCoupon}
                      onPendingDishChange={setPendingDishId}
                      onRemoveDish={removeDishFromSelectedCoupon}
                      onSave={handleSaveChanges}
                      onToggleStatus={toggleSelectedCouponStatus}
                      pendingDishId={pendingDishId}
                      variant="inline"
                    />
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
                Detalle del cupon
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Los datos del cupon se cargan en segundo plano.
              </p>
            </div>
            <div className="p-5 py-10">
              <LoadingIndicator label="Cargando detalle de cupones..." />
            </div>
          </section>
        )}

        {loadError && (
          <section className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm xl:block dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Detalle del cupon
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
          <CouponFormPanel
            availableDishes={availableDishes}
            coupon={createCoupon}
            error={formError}
            isAddingDish={isAddingDish}
            isAddingDishRow={isAddingDishRow}
            isSaving={isSavingChanges}
            mode="create"
            onAddDish={() => startAddingDishRow(createCoupon)}
            onCancel={handleCancelCreate}
            onCancelDish={cancelAddingDishRow}
            onChange={updateCreateCoupon}
            onCloseError={() => setFormError(null)}
            onConfirmDish={addDishToCreateCoupon}
            onPendingDishChange={setPendingDishId}
            onRemoveDish={removeDishFromCreateCoupon}
            onSave={handleCreateCoupon}
            pendingDishId={pendingDishId}
          />
        )}

        {isDataReady && !showCreateForm && selectedCoupon && editableSelectedCoupon && (
          <CouponFormPanel
            availableDishes={availableDishes}
            coupon={editableSelectedCoupon}
            error={formError}
            hasChanges={hasSelectedCouponChanges}
            isAddingDish={isAddingDish}
            isAddingDishRow={isAddingDishRow}
            isDeleting={isDeletingCoupon}
            isSaving={isSavingChanges}
            mode="edit"
            onAddDish={() => startAddingDishRow(editableSelectedCoupon)}
            onCancel={handleCancelChanges}
            onCancelDish={cancelAddingDishRow}
            onChange={updateSelectedCoupon}
            onCloseError={() => setFormError(null)}
            onConfirmDish={addDishToSelectedCoupon}
            onDelete={handleDeleteCoupon}
            onPendingDishChange={setPendingDishId}
            onRemoveDish={removeDishFromSelectedCoupon}
            onSave={handleSaveChanges}
            onToggleStatus={toggleSelectedCouponStatus}
            pendingDishId={pendingDishId}
          />
        )}
      </div>
    </section>
  );
}

function CouponFormPanel({
  availableDishes,
  coupon,
  error,
  hasChanges = false,
  isAddingDish,
  isAddingDishRow,
  isDeleting = false,
  isSaving,
  mode,
  onAddDish,
  onCancel,
  onCancelDish,
  onChange,
  onCloseError,
  onConfirmDish,
  onDelete,
  onPendingDishChange,
  onRemoveDish,
  onSave,
  onToggleStatus,
  pendingDishId,
  variant = "panel",
}: {
  availableDishes: CouponDish[];
  coupon: RestaurantCoupon;
  error: string | null;
  hasChanges?: boolean;
  isAddingDish: boolean;
  isAddingDishRow: boolean;
  isDeleting?: boolean;
  isSaving: boolean;
  mode: "create" | "edit";
  onAddDish: () => void;
  onCancel: () => void;
  onCancelDish: () => void;
  onChange: (updates: Partial<RestaurantCoupon>) => void;
  onCloseError: () => void;
  onConfirmDish: () => void;
  onDelete?: () => void;
  onPendingDishChange: (dishId: string) => void;
  onRemoveDish: (dishId: string) => void;
  onSave: () => void;
  onToggleStatus?: () => void;
  pendingDishId: string;
  variant?: "panel" | "inline";
}) {
  const isCreate = mode === "create";
  const isInline = variant === "inline";

  return (
    <section
      className={clsx(
        isInline
          ? "space-y-4 p-4 xl:hidden"
          : "overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
        !isCreate && !isInline && "hidden xl:block",
      )}
    >
      {!isInline && (
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-5 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
              {isCreate ? "Nuevo cupon" : "Detalle del cupon"}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              {isCreate
                ? "Completa los datos para dar de alta un nuevo cupon."
                : "Edita los datos o da de baja el cupon."}
            </p>
          </div>
          {!isCreate && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={isSaving || isDeleting}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-extrabold text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
            >
              <TrashIcon className="h-4 w-4" />
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </button>
          ) : null}
        </div>
      )}

      <div className={clsx("space-y-4", !isInline && "p-5")}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Codigo
            </span>
            <input
              value={coupon.code}
              onChange={(event) =>
                onChange({ code: event.target.value.toUpperCase() })
              }
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Porcentaje
            </span>
            <input
              type="number"
              min={1}
              max={100}
              value={coupon.percentage}
              onChange={(event) =>
                onChange({ percentage: Number(event.target.value) })
              }
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
            Descripcion
          </span>
          <textarea
            value={coupon.description}
            onChange={(event) => onChange({ description: event.target.value })}
            rows={3}
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          {!isCreate && !isInline ? (
            <div>
              <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                Fecha de creacion
              </span>
              <div className="flex h-11 w-full items-center rounded-xl border border-gray-200 bg-slate-50 px-4 text-sm font-extrabold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                {formatDateTimeLabel(coupon.createdAt)}
              </div>
            </div>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Fecha de vencimiento
            </span>
            <input
              type="datetime-local"
              value={coupon.expiresAt}
              onChange={(event) => onChange({ expiresAt: event.target.value })}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
          </label>

        </div>

        <div>
          <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
            Platos asociados
          </span>

          {error && (
            <div className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              <p>{error}</p>
              <button
                type="button"
                onClick={onCloseError}
                aria-label="Cerrar error"
                className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg text-red-500 transition hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/20"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          <DishRows
            availableDishes={availableDishes}
            disabled={isSaving || isDeleting}
            dishes={coupon.dishes}
            isAddingDish={isAddingDish}
            isAddingDishRow={isAddingDishRow}
            onAdd={onAddDish}
            onCancel={onCancelDish}
            onConfirm={onConfirmDish}
            onPendingChange={onPendingDishChange}
            onRemove={onRemoveDish}
            pendingDishId={pendingDishId}
          />
        </div>
      </div>

      <div
        className={clsx(
          "flex flex-col-reverse gap-3 border-t border-gray-200 sm:flex-row sm:justify-end dark:border-slate-800",
          isInline ? "pt-4" : "px-5 py-5",
        )}
      >
        {(isCreate || hasChanges || isInline) && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving || isDeleting}
            className="h-11 cursor-pointer rounded-xl bg-slate-100 px-5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
        )}
        {!isCreate && onToggleStatus ? (
          <button
            type="button"
            onClick={onToggleStatus}
            disabled={isSaving || isDeleting}
            className="h-11 cursor-pointer rounded-xl bg-orange-50 px-5 text-sm font-extrabold text-orange-600 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
          >
            {isSaving
              ? "Marcando..."
              : coupon.status === "inactive"
                ? "Marcar activo"
                : "Marcar inactivo"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || isDeleting}
          className="h-11 cursor-pointer rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? isCreate
              ? "Creando..."
              : "Guardando..."
            : isCreate
              ? "Crear cupon"
              : "Guardar cambios"}
        </button>
      </div>
    </section>
  );
}
