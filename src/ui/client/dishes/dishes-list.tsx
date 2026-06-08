"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MinusIcon, PlusIcon, TagIcon } from "@heroicons/react/24/outline";

import { getDishes, getDiscountedDishIds, getDishDiscount, updateCartItem, type DishFilter } from "@/services/client/client-service";
import type { Cart, ClientDish, Discount } from "@/lib/client/types";

const PAGE_SIZE = 20;

type OrdenValue = "" | "precio-asc" | "precio-desc";
type Filters = Omit<DishFilter, "pagina" | "tamano">;

function DishSkeleton() {
  return (
    <div className="flex flex-wrap">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div key={i} className="px-2 py-2 w-1/2 md:w-1/3 lg:w-1/4">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden animate-pulse">
            <div className="bg-gray-100 h-[150px]" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
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
      const [orden, sentido] = val.split("-") as ["precio", "asc" | "desc"];
      updateFilters({ orden, sentido });
    }
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
      <div className="flex flex-wrap items-center bg-white p-3 rounded-xl gap-x-6 gap-y-2 mb-6 border-b border-gray-100 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-600">Ordenar:</span>
          <select
            value={ordenValue}
            onChange={(e) => handleOrden(e.target.value as OrdenValue)}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
          >
            <option value="">Por defecto</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
          </select>
        </div>

        <div className="h-4 w-px bg-gray-200 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-600">Filtrar:</span>
          <button
            type="button"
            onClick={toggleDescuento}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
              filters.conDescuento
                ? "border-orange-600 bg-orange-600 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-600"
            }`}
          >
            <TagIcon className="h-3.5 w-3.5" />
            Con descuento
          </button>
        </div>

        <div className="h-4 w-px bg-gray-200 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="font-medium text-gray-600">Precio:</span>
          <input
            type="number"
            min={0}
            placeholder="mín"
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
            onBlur={applyPrecio}
            onKeyDown={(e) => e.key === "Enter" && applyPrecio()}
            className="w-20 rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
          <span className="text-gray-400">—</span>
          <input
            type="number"
            min={0}
            placeholder="máx"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            onBlur={applyPrecio}
            onKeyDown={(e) => e.key === "Enter" && applyPrecio()}
            className="w-20 rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
        </div>
      </div>

      {/* Resultados */}
      {loading || (page === 1 && discountsPending) ? (
        <DishSkeleton />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
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
                  <div className="rounded-xl border border-gray-200 hover:border-orange-700 transition-all duration-200 bg-white overflow-hidden flex flex-col">
                    <Link href={`/client/platos/${dish.id}`} className="block">
                      <div className="relative flex items-center justify-center bg-orange-50 h-[150px]">
                        {discount && (
                          <span className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-orange-600 px-2 py-0.5 text-xs font-bold text-white shadow">
                            <TagIcon className="h-3 w-3" />
                            -{discount.porcentaje}%
                          </span>
                        )}
                        {dish.imageUrl ? (
                          <img
                            alt={dish.name}
                            src={dish.imageUrl}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="text-4xl font-black text-orange-600">
                            {dish.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="px-4 pt-4 pb-2">
                        <span className="inline-block font-bold text-gray-800">
                          {dish.name}
                        </span>
                        <div className="mt-1 flex items-center gap-2">
                          {discountedPrice != null ? (
                            <>
                              <span className="text-md text-orange-700 font-bold">
                                ${discountedPrice}
                              </span>
                              <span className="text-sm text-gray-400 line-through">
                                ${dish.price}
                              </span>
                            </>
                          ) : (
                            <span className="text-md text-orange-700 font-bold">
                              ${dish.price}
                            </span>
                          )}
                        </div>
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
                          <div className="flex items-center justify-between border border-orange-200 rounded-lg px-2 py-1">
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleCartUpdate(dish.id, -1)}
                              className="p-1 rounded-md hover:bg-orange-50 transition-colors disabled:opacity-60"
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
                              className="p-1 rounded-md hover:bg-orange-50 transition-colors disabled:opacity-60"
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
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
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
