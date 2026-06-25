"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  InformationCircleIcon,
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

import {
  getClientDishCategories,
  getDishes,
  getDiscountedDishIds,
  getDishDiscount,
  updateCartItem,
  type DishFilter,
} from "@/services/client/client-service";
import type {
  Cart,
  ClientDish,
  ClientDishCategory,
  Discount,
} from "@/lib/client/types";

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
};

export default function DishesList({ idLocal, cart, onCartUpdate }: Props) {
  const [dishes, setDishes] = useState<ClientDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [categories, setCategories] = useState<ClientDishCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");

  // IDs de platos con descuento activo (para este local) y detalle de cada descuento ya consultado.
  // El Map guarda `null` para los que ya se consultaron pero no tienen descuento vigente — así
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

    getClientDishCategories()
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
    // de Strict Mode (monta → limpia → vuelve a montar), así la segunda pasada no reintenta
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

  function handleCategory(value: string) {
    const categoryId = Number(value);

    updateFilters({
      categoriaId: value && !isNaN(categoryId) ? categoryId : undefined,
    });
  }

  function toggleDescuento() {
    updateFilters({ conDescuento: filters.conDescuento ? undefined : true });
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
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-gray-100 bg-white p-2.5 text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:mb-6 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2 sm:border-b sm:p-3">
        <div className="min-w-0 sm:flex sm:items-center sm:gap-2">
          <span className="hidden font-medium text-gray-600 dark:text-slate-300 sm:inline">Ordenar:</span>
          <select
            aria-label="Ordenar platos"
            value={ordenValue}
            onChange={(e) => handleOrden(e.target.value as OrdenValue)}
            className="w-full min-w-0 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20 sm:w-auto sm:text-sm sm:font-normal"
          >
            <option value="">Por defecto</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="ventas-desc">Mas vendidos</option>
            <option value="ventas-asc">Menos vendidos</option>
          </select>
        </div>

        <div className="hidden h-4 w-px bg-gray-200 dark:bg-slate-700 sm:block" />

        <div className="min-w-0 sm:flex sm:items-center sm:gap-2">
          <span className="hidden font-medium text-gray-600 dark:text-slate-300 sm:inline">Filtrar:</span>
          <button
            type="button"
            aria-label="Filtrar platos con descuento"
            onClick={toggleDescuento}
            className={`flex w-full min-w-0 items-center justify-center gap-1.5 rounded-full border px-2 py-1.5 text-xs font-semibold transition-colors sm:w-auto sm:px-3 sm:py-1 sm:text-sm sm:font-medium ${
              filters.conDescuento
                ? "border-orange-600 bg-orange-600 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-orange-500/60 dark:hover:text-orange-300"
            }`}
          >
            <TagIcon className="h-3.5 w-3.5" />
            Con descuento
          </button>
        </div>

        <div className="hidden h-4 w-px bg-gray-200 dark:bg-slate-700 sm:block" />

        <div className="min-w-0 sm:flex sm:items-center sm:gap-2">
          <span className="hidden font-medium text-gray-600 dark:text-slate-300 sm:inline">Categoría:</span>
          <select
            aria-label="Filtrar platos por categoria"
            value={filters.categoriaId ?? ""}
            onChange={(e) => handleCategory(e.target.value)}
            disabled={loadingCategories || categories.length === 0}
            className="w-full min-w-0 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20 sm:max-w-[180px] sm:text-sm sm:font-normal"
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden h-4 w-px bg-gray-200 dark:bg-slate-700 sm:block" />

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 sm:flex">
          <span className="hidden font-medium text-gray-600 dark:text-slate-300 sm:inline">Precio:</span>
          <input
            aria-label="Precio minimo"
            type="number"
            min={0}
            placeholder="mín"
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
            onBlur={applyPrecio}
            onKeyDown={(e) => e.key === "Enter" && applyPrecio()}
            className="min-w-0 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20 sm:w-20 sm:text-sm sm:font-normal"
          />
          <span className="text-gray-400 dark:text-slate-500">—</span>
          <input
            aria-label="Precio maximo"
            type="number"
            min={0}
            placeholder="máx"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            onBlur={applyPrecio}
            onKeyDown={(e) => e.key === "Enter" && applyPrecio()}
            className="min-w-0 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20 sm:w-20 sm:text-sm sm:font-normal"
          />
        </div>
      </div>

      {/* Resultados */}
      {loading || (page === 1 && discountsPending) ? (
        <DishSkeleton />
      ) : error ? (
        <p className="text-sm text-red-500 dark:text-red-300">{error}</p>
      ) : dishes.length === 0 ? (
        <p className="text-sm text-slate-400">
          No se encontraron resultados para los filtros aplicados.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap">
            {dishes.map((dish) => {
              const qty = getCartQty(dish.id);
              const isUpdating = updatingDishId === dish.id;
              const discount = discounts.get(dish.id);
              const discountedPrice = discount
                ? Math.round(dish.price * (1 - discount.porcentaje / 100) * 100) / 100
                : null;
              return (
                <div key={dish.id} className="px-2 py-2 w-1/2 md:w-1/3 lg:w-1/4">
                  <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-orange-700 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500">
                    <Link href={`/client/platos/${dish.id}`} className="block">
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
                      <div className="px-4 pt-4 pb-2">
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
                    </Link>

                    {/* Contador de carrito — solo visible dentro de un local */}
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
    </div>
  );
}
