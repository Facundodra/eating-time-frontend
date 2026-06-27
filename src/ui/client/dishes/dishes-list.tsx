"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowsUpDownIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  InformationCircleIcon,
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  TagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import {
  getClientDishCategorySummaries,
  getAllDishes,
  getDishes,
  getDiscountedDishIds,
  getDishDiscount,
  updateCartItem,
  type DishFilter,
} from "@/services/client/client-service";
import type {
  Cart,
  ClientDish,
  ClientDishCategorySummary,
  Discount,
} from "@/lib/client/types";
import CategoryCarousel from "@/ui/client/categories/category-carousel";
import DishesDetailPage from "@/ui/client/dishes/dishes-detail-page";

const PAGE_SIZE = 20;

type OrdenValue =
  | ""
  | "precio-asc"
  | "precio-desc"
  | "ventas-desc"
  | "ventas-asc";
type Filters = Omit<DishFilter, "pagina" | "tamano">;

function DishSkeleton() {
  return (
    <div className="flex flex-wrap">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div key={i} className="px-2 py-2 w-1/2 md:w-1/3 lg:w-1/4">
          <div className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="h-[150px] bg-gray-100 dark:bg-slate-800" />
            <div className="p-4 space-y-3">
              <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-700" />
              <div className="h-3 w-1/4 rounded bg-gray-100 dark:bg-slate-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

type Props = {
  idLocal?: number;
  cart?: Cart | null;
  onCartUpdate?: (cart: Cart | null) => void;
  initialSelectedDishId?: string | null;
};

export default function DishesList({
  idLocal,
  cart,
  onCartUpdate,
  initialSelectedDishId = null,
}: Props) {
  const router = useRouter();
  const [dishes, setDishes] = useState<ClientDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [categories, setCategories] = useState<ClientDishCategorySummary[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [localCategoryIds, setLocalCategoryIds] = useState<Set<number> | null>(
    null,
  );
  const [loadingLocalCategories, setLoadingLocalCategories] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [query, setQuery] = useState("");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null);
  const [dismissedInitialDishId, setDismissedInitialDishId] = useState<
    string | null
  >(null);

  // IDs de platos con descuento activo (para este local) y detalle de cada descuento ya consultado.
  // El Map guarda `null` para los que ya se consultaron pero no tienen descuento vigente:
  // podemos distinguir "todavía no se consultó" (afecta el skeleton) de "se consultó, no hay descuento".
  const [discountedIds, setDiscountedIds] = useState<Set<number> | null>(null);
  const [discounts, setDiscounts] = useState<Map<number, Discount | null>>(new Map());
  // IDs cuyo detalle de descuento ya fue solicitado (evita pedirlo de nuevo aunque la respuesta haya sido null)
  const requestedDiscountIds = useRef<Set<number>>(new Set());

  // ID del plato que está siendo actualizado en el carrito (para mostrar spinner)
  const [updatingDishId, setUpdatingDishId] = useState<number | null>(null);
  // Mutex síncrono: evita que requests concurrentes al mismo endpoint creen carritos duplicados
  const cartUpdateInFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;

    getClientDishCategorySummaries()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCategories(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!idLocal) {
      setLocalCategoryIds(null);
      setLoadingLocalCategories(false);
      return;
    }

    let cancelled = false;
    setLoadingLocalCategories(true);

    getAllDishes({ idLocal })
      .then((localDishes) => {
        if (cancelled) return;

        setLocalCategoryIds(
          new Set(localDishes.flatMap((dish) => dish.categories)),
        );
      })
      .catch(() => {
        if (!cancelled) setLocalCategoryIds(new Set());
      })
      .finally(() => {
        if (!cancelled) setLoadingLocalCategories(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idLocal]);

  // IDs con descuento activo: se recalculan solo cuando cambia el local, y limpian el cache de detalles
  useEffect(() => {
    setDiscountedIds(null);
    setDiscounts(new Map());
    requestedDiscountIds.current = new Set();

    let cancelled = false;
    getDiscountedDishIds(idLocal)
      .then((ids) => {
        if (!cancelled) setDiscountedIds(ids);
      })
      .catch(() => {
        if (!cancelled) setDiscountedIds(new Set());
      });

    return () => {
      cancelled = true;
    };
  }, [idLocal]);

  useEffect(() => {
    if (!initialSelectedDishId) {
      setDismissedInitialDishId(null);
      setSelectedDishId(null);
      return;
    }

    if (dismissedInitialDishId === initialSelectedDishId) return;

    const parsedDishId = Number(initialSelectedDishId);
    setSelectedDishId(Number.isFinite(parsedDishId) ? parsedDishId : null);
  }, [dismissedInitialDishId, initialSelectedDishId]);

  useEffect(() => {
    const isNewSearch = page === 1;
    if (isNewSearch) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    getDishes({ ...filters, idLocal, pagina: page, tamano: PAGE_SIZE })
      .then((data) => {
        setDishes((prev) => (isNewSearch ? data : [...prev, ...data]));
        setHasMore(data.length === PAGE_SIZE);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error al cargar"),
      )
      .finally(() => {
        if (isNewSearch) setLoading(false);
        else setLoadingMore(false);
      });
  }, [filters, page, idLocal]);

  // Para los platos recién cargados que tienen descuento activo y aún no fueron consultados, pedimos el detalle en paralelo
  useEffect(() => {
    if (!discountedIds) return;

    const idsToFetch = dishes
      .map((dish) => dish.id)
      .filter((id) => discountedIds.has(id) && !requestedDiscountIds.current.has(id));

    if (idsToFetch.length === 0) return;
    // Marcamos los IDs como solicitados de inmediato: el ref persiste entre el doble efecto
    // de Strict Mode (monta, limpia y vuelve a montar), así la segunda pasada no reintenta
    // y la promesa de la primera pasada queda como única responsable de actualizar el estado
    // (si usáramos también un flag "cancelled" por efecto, esa promesa quedaría descartada
    // y el listado se quedaría esperando el descuento para siempre).
    idsToFetch.forEach((id) => requestedDiscountIds.current.add(id));

    Promise.allSettled(idsToFetch.map(getDishDiscount)).then((results) => {
      setDiscounts((prev) => {
        const next = new Map(prev);
        results.forEach((result, i) => {
          // Guardamos null también ante rechazo/"sin descuento": marca el ID como resuelto
          // para no reintentar en loop y para que el skeleton deje de esperarlo.
          next.set(idsToFetch[i], result.status === "fulfilled" ? result.value : null);
        });
        return next;
      });
    });
  }, [dishes, discountedIds]);

  function updateFilters(patch: Partial<Filters>) {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  }

  function handleOrden(val: OrdenValue) {
    if (val === "") {
      updateFilters({ orden: undefined, sentido: undefined });
    } else {
      const [orden, sentido] = val.split("-") as [
        "precio" | "ventas",
        "asc" | "desc",
      ];
      updateFilters({ orden, sentido });
    }
  }

  function toggleDescuento() {
    updateFilters({ conDescuento: filters.conDescuento ? undefined : true });
  }

  function clearFilters() {
    setPage(1);
    setFilters({});
    setPrecioMin("");
    setPrecioMax("");
    setQuery("");
  }

  function applyPrecio() {
    const min = Number(precioMin);
    const max = Number(precioMax);
    updateFilters({
      precioMin: precioMin !== "" && !isNaN(min) ? min : undefined,
      precioMax: precioMax !== "" && !isNaN(max) ? max : undefined,
    });
  }

  const ordenValue: OrdenValue = filters.orden
    ? `${filters.orden}-${filters.sentido ?? "asc"}`
    : "";
  const hasActiveFilters =
    Boolean(query) ||
    Boolean(filters.categoriaId) ||
    Boolean(filters.conDescuento) ||
    filters.precioMin != null ||
    filters.precioMax != null;
  const visibleDishes = dishes.filter((dish) => {
    if (query.trim() && !dish.name.toLowerCase().includes(query.trim().toLowerCase())) {
      return false;
    }
    if (filters.conDescuento && !discounts.get(dish.id)) return false;
    return true;
  });
  const visibleCategories =
    idLocal && localCategoryIds
      ? categories.filter((category) => localCategoryIds.has(category.id))
      : categories;

  // Mientras no sepamos qué platos de la página actual tienen descuento (o aún falten consultar
  // su detalle), seguimos mostrando el skeleton para evitar el "flash" del precio sin descontar.
  const discountsPending =
    discountedIds === null ||
    dishes.some((d) => discountedIds.has(d.id) && !discounts.has(d.id));

  // Devuelve la cantidad del plato en el carrito actual (0 si no está)
  function getCartQty(dishId: number): number {
    if (!cart) return 0;
    const item = cart.items.find(
      // Usamos != null para cubrir tanto null como undefined (Jackson puede omitir el campo)
      (i) => i.platoId === dishId && i.eliminacion == null
    );
    return item?.cantidad ?? 0;
  }

  async function handleCartUpdate(dishId: number, delta: number) {
    if (!idLocal || !onCartUpdate) return;
    if (cartUpdateInFlight.current) return;
    cartUpdateInFlight.current = true;
    setUpdatingDishId(dishId);
    try {
      const updated = await updateCartItem(idLocal, dishId, delta);
      // El carrito está activo si tiene al menos un ítem sin eliminar.
      // No usamos `eliminacion` del cart porque el backend puede devolverlo
      // con timestamp aunque el carrito siga activo (registro reutilizado).
      const hasActiveItems = (updated.items ?? []).some((i) => i.eliminacion == null);
      onCartUpdate(hasActiveItems ? updated : null);
    } catch (err) {
      console.error("[carrito] error en updateCartItem:", err);
    } finally {
      cartUpdateInFlight.current = false;
      setUpdatingDishId(null);
    }
  }

  return (
    <div className="max-w-[1440px] mx-auto">
      {/* Barra de filtros */}
      <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:mb-6">
        <div className="grid gap-4 xl:hidden">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              className="flex h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-extrabold text-slate-700 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
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
                onClick={clearFilters}
                aria-label="Limpiar filtros"
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
              >
                <FunnelIcon className="h-5 w-5" />
                <XMarkIcon className="absolute right-2 top-2 h-3 w-3 stroke-[3]" />
              </button>
            )}
            <div className="ml-auto flex min-w-0 items-center gap-2">
              <ArrowsUpDownIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
              <select
                aria-label="Ordenar platos"
                value={ordenValue}
                onChange={(e) => handleOrden(e.target.value as OrdenValue)}
                className="h-11 w-[125px] rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
              >
                <option value="">Por defecto</option>
                <option value="precio-asc">Precio menor</option>
                <option value="precio-desc">Precio mayor</option>
                <option value="ventas-desc">Más vendidos</option>
                <option value="ventas-asc">Menos vendidos</option>
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
                      Ajusta los platos visibles del local.
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
                  <label className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Nombre
                    </span>
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Buscar plato"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20"
                    />
                  </label>
                  <div>
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Precio
                    </span>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5">
                      <input
                        aria-label="Precio mínimo"
                        type="number"
                        min={0}
                        placeholder="min"
                        value={precioMin}
                        onChange={(e) => setPrecioMin(e.target.value)}
                        onBlur={applyPrecio}
                        onKeyDown={(e) => e.key === "Enter" && applyPrecio()}
                        className="h-11 min-w-0 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        aria-label="Precio máximo"
                        type="number"
                        min={0}
                        placeholder="max"
                        value={precioMax}
                        onChange={(e) => setPrecioMax(e.target.value)}
                        onBlur={applyPrecio}
                        onKeyDown={(e) => e.key === "Enter" && applyPrecio()}
                        className="h-11 min-w-0 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleDescuento}
                    aria-pressed={Boolean(filters.conDescuento)}
                    className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-extrabold transition ${
                      filters.conDescuento
                        ? "border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-500/60 dark:bg-orange-500/15 dark:text-orange-300"
                        : "border-gray-200 bg-white text-slate-600 hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
                    }`}
                  >
                    <TagIcon className="h-4 w-4" />
                    Con descuento
                  </button>
                </div>
                <div className="flex gap-3 border-t border-gray-200 px-5 py-4 dark:border-slate-800">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-500 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
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

        <div className="hidden gap-5 xl:grid xl:grid-cols-[minmax(16rem,1fr)_auto_auto_auto] xl:items-center">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar plato"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20"
          />
          <div className="flex min-w-0 items-center gap-2">
            <ArrowsUpDownIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
            <select
              aria-label="Ordenar platos"
              value={ordenValue}
              onChange={(e) => handleOrden(e.target.value as OrdenValue)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              <option value="">Por defecto</option>
              <option value="precio-asc">Precio menor</option>
              <option value="precio-desc">Precio mayor</option>
              <option value="ventas-desc">Más vendidos</option>
              <option value="ventas-asc">Menos vendidos</option>
            </select>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <TagIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
            <button
              type="button"
              aria-label="Filtrar platos con descuento"
              onClick={toggleDescuento}
              aria-pressed={Boolean(filters.conDescuento)}
              className={`flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-extrabold transition ${
                filters.conDescuento
                  ? "border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-500/60 dark:bg-orange-500/15 dark:text-orange-300"
                  : "border-gray-200 bg-white text-slate-600 hover:border-orange-200 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
              }`}
            >
              Con descuento
            </button>
          </div>
          <div className="grid grid-cols-[auto_5rem_auto_5rem] items-center gap-1.5">
            <CurrencyDollarIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <input
              aria-label="Precio mínimo"
              type="number"
              min={0}
              placeholder="min"
              value={precioMin}
              onChange={(e) => setPrecioMin(e.target.value)}
              onBlur={applyPrecio}
              onKeyDown={(e) => e.key === "Enter" && applyPrecio()}
              className="h-10 min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
            <span className="text-gray-400 dark:text-slate-500">-</span>
            <input
              aria-label="Precio máximo"
              type="number"
              min={0}
              placeholder="max"
              value={precioMax}
              onChange={(e) => setPrecioMax(e.target.value)}
              onBlur={applyPrecio}
              onKeyDown={(e) => e.key === "Enter" && applyPrecio()}
              className="h-10 min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
          </div>
        </div>
      </section>

      <CategoryCarousel
        categories={visibleCategories}
        loading={loadingCategories || loadingLocalCategories}
        selectedCategoryId={filters.categoriaId ?? null}
        onSelectCategory={(category) =>
          updateFilters({
            categoriaId:
              filters.categoriaId === category.id ? undefined : category.id,
          })
        }
      />


      {/* Resultados */}
      {loading || (page === 1 && discountsPending) ? (
        <DishSkeleton />
      ) : error ? (
        <p className="text-sm text-red-500 dark:text-red-300">{error}</p>
      ) : visibleDishes.length === 0 ? (
        <p className="text-sm text-slate-400">
          No se encontraron resultados para los filtros aplicados.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap">
            {visibleDishes.map((dish) => {
              const qty = getCartQty(dish.id);
              const isUpdating = updatingDishId === dish.id;
              const discount = discounts.get(dish.id);
              const discountedPrice = discount
                ? Math.round(dish.price * (1 - discount.porcentaje / 100) * 100) / 100
                : null;
              const dishPreview = (
                <>
                  <div className="relative flex h-[150px] items-center justify-center bg-orange-50 dark:bg-orange-500/10">
                    {discount && (
                      <span className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-orange-600 px-2 py-0.5 text-xs font-bold text-white shadow">
                        <TagIcon className="h-3 w-3" />
                        -{discount.porcentaje}%
                      </span>
                    )}
                    <span
                      title="Ver descripcion"
                      className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm ring-1 ring-slate-200 transition dark:bg-slate-950/90 dark:text-slate-200 dark:ring-slate-700"
                    >
                      <InformationCircleIcon className="h-4 w-4" />
                      <span className="sr-only">Ver descripcion</span>
                    </span>
                    {dish.imageUrl ? (
                      <Image
                        alt={dish.name}
                        src={dish.imageUrl}
                        fill
                        unoptimized
                        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-black text-orange-600 dark:text-orange-300">
                        {dish.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="px-4 pt-4 pb-2 text-left">
                    <span className="inline-block font-bold text-gray-800 dark:text-slate-100">
                      {dish.name}
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      {discountedPrice != null ? (
                        <>
                          <span className="text-md text-orange-700 font-bold">
                            ${discountedPrice}
                          </span>
                          <span className="text-sm text-gray-400 line-through dark:text-slate-500">
                            ${dish.price}
                          </span>
                        </>
                      ) : (
                        <span className="text-md text-orange-700 font-bold">
                          ${dish.price}
                        </span>
                      )}
                    </div>
                    {dish.salesCount > 0 ? (
                      <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                        <ShoppingBagIcon className="h-3.5 w-3.5" />
                        {dish.salesCount} ventas
                      </div>
                    ) : null}
                  </div>
                </>
              );

              return (
                <div key={dish.id} className="px-2 py-2 w-1/2 md:w-1/3 lg:w-1/4">
                  <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-orange-700 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500">
                    <button
                      type="button"
                      onClick={() => setSelectedDishId(dish.id)}
                      className="block w-full"
                    >
                      {dishPreview}
                    </button>

                    {/* Contador de carrito: solo visible dentro de un local */}
                    {idLocal && onCartUpdate && (
                      <div className="px-4 pb-4 mt-auto">
                        {qty === 0 ? (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleCartUpdate(dish.id, 1)}
                            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-orange-700 hover:bg-orange-800 text-white text-sm font-semibold py-2 transition-colors disabled:opacity-60"
                          >
                            {isUpdating ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              <>
                                <PlusIcon className="w-4 h-4" />
                                Agregar
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="flex items-center justify-between rounded-lg border border-orange-200 px-2 py-1 dark:border-orange-500/30">
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleCartUpdate(dish.id, -1)}
                              className="rounded-md p-1 transition-colors hover:bg-orange-50 disabled:opacity-60 dark:hover:bg-orange-500/10"
                            >
                              <MinusIcon className="w-4 h-4 text-orange-700" />
                            </button>

                            {isUpdating ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-300 border-t-orange-700" />
                            ) : (
                              <span className="font-bold text-orange-700 text-sm min-w-[20px] text-center">
                                {qty}
                              </span>
                            )}

                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleCartUpdate(dish.id, 1)}
                              className="rounded-md p-1 transition-colors hover:bg-orange-50 disabled:opacity-60 dark:hover:bg-orange-500/10"
                            >
                              <PlusIcon className="w-4 h-4 text-orange-700" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cargar más */}
          {hasMore && (
            <div className="flex justify-center mt-8 mb-4">
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {loadingMore ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-orange-600" />
                    Cargando...
                  </>
                ) : (
                  "Cargar más"
                )}
              </button>
            </div>
          )}
        </>
      )}
      {selectedDishId != null ? (
        <DishesDetailPage
          id={String(selectedDishId)}
          onClose={() => {
            setSelectedDishId(null);
            if (idLocal && initialSelectedDishId) {
              setDismissedInitialDishId(initialSelectedDishId);
              router.replace(`/client/restaurant/${idLocal}`, { scroll: false });
            }
          }}
        />
      ) : null}
    </div>
  );
}
