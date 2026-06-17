import type {
  RestaurantDashboardData,
  RestaurantDashboardOrder,
  RestaurantDashboardStat,
} from "@/lib/restaurant/dashboard/types";
import type { RestaurantClaim } from "@/lib/restaurant/claim/types";
import type { OrderStatus, WorkbenchOrder } from "@/lib/restaurant/workbench/types";
import { getRestaurantClaims } from "@/services/restaurant/claim-service";
import { getRestaurantDishes } from "@/services/restaurant/dish-service";
import { fetchWorkbenchOrders } from "@/services/restaurant/workbench-service";

const activeStatuses = new Set<OrderStatus>([
  "PENDIENTE_CONFIRMACION_LOCAL",
  "ACEPTADO_LOCAL",
  "EN_CURSO_LOCAL",
  "EN_CAMINO_LOCAL",
]);

const statusLabels: Record<OrderStatus, string> = {
  EN_CARRITO: "En carrito",
  ETAPA_DE_PAGO: "En pago",
  PENDIENTE_CONFIRMACION_LOCAL: "Pendiente",
  ACEPTADO_LOCAL: "Aceptado",
  EN_CURSO_LOCAL: "En curso",
  EN_CAMINO_LOCAL: "En camino",
  FINALIZADO: "Finalizado",
  RECHAZADO_LOCAL: "Rechazado",
  CANCELADO_CLIENTE: "Cancelado",
};

function formatPrice(price: number) {
  return `$${price.toLocaleString("es-UY")}`;
}

function isToday(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();

  return date.toDateString() === today.toDateString();
}

function formatTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString("es-UY", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function mapRecentOrder(order: WorkbenchOrder): RestaurantDashboardOrder {
  return {
    id: order.id,
    customerLabel: order.customerName ?? "Cliente sin identificar",
    status: order.status,
    statusLabel: statusLabels[order.status],
    time: formatTime(order.createdAt),
    total: formatPrice(order.total),
  };
}

function buildStats(
  orders: WorkbenchOrder[] | null,
  dishes: Awaited<ReturnType<typeof getRestaurantDishes>>["dishes"] | null,
  claims: RestaurantClaim[] | null,
): RestaurantDashboardStat[] {
  const activeOrders = orders
    ? orders.filter((order) => activeStatuses.has(order.status))
    : null;
  const todayRevenue = orders
    ? orders
        .filter(
          (order) =>
            isToday(order.createdAt) &&
            order.status !== "RECHAZADO_LOCAL" &&
            order.status !== "CANCELADO_CLIENTE",
        )
        .reduce((total, order) => total + order.total, 0)
    : null;
  const availableDishes = dishes
    ? dishes.filter((dish) => dish.status === "available")
    : null;
  const pendingClaims = claims
    ? claims.filter((claim) => claim.status === "pending")
    : null;

  return [
    {
      label: "Pedidos activos",
      value: activeOrders ? activeOrders.length.toString() : "-",
      tag: "En curso",
      tone: "amber",
    },
    {
      label: "Ingresos del día",
      value: todayRevenue !== null ? formatPrice(todayRevenue) : "-",
      tag: "Hoy",
      tone: "emerald",
    },
    {
      label: "Platos disponibles",
      value: availableDishes ? availableDishes.length.toString() : "-",
      tag: "Activos",
      tone: "emerald",
    },
    {
      label: "Reclamos por atender",
      value: pendingClaims ? pendingClaims.length.toString() : "-",
      tag: "A revisar",
      tone: "amber",
    },
  ];
}

export async function getRestaurantDashboardData(
  restaurantId: string,
): Promise<RestaurantDashboardData> {
  const [ordersResult, dishesResult, claimsResult] = await Promise.allSettled([
    fetchWorkbenchOrders(restaurantId, {
      direction: "desc",
      sortBy: "antiguedad",
    }),
    getRestaurantDishes(restaurantId),
    getRestaurantClaims(restaurantId),
  ]);

  const orders =
    ordersResult.status === "fulfilled" ? ordersResult.value : null;
  const dishes =
    dishesResult.status === "fulfilled" ? dishesResult.value.dishes : null;
  const claims =
    claimsResult.status === "fulfilled" ? claimsResult.value.claims : null;
  const ordersError =
    ordersResult.status === "rejected"
      ? ordersResult.reason instanceof Error
        ? ordersResult.reason.message
        : "No se pudieron cargar los pedidos."
      : null;
  const dishesError =
    dishesResult.status === "rejected"
      ? dishesResult.reason instanceof Error
        ? dishesResult.reason.message
        : "No se pudieron cargar los platos."
      : null;
  const claimsError =
    claimsResult.status === "rejected"
      ? claimsResult.reason instanceof Error
        ? claimsResult.reason.message
        : "No se pudieron cargar los reclamos."
      : null;
  const statsError =
    ordersError || dishesError || claimsError
      ? "No se pudieron cargar todos los indicadores del local."
      : null;
  const recentOrders = [...(orders ?? [])]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5)
    .map(mapRecentOrder);

  return {
    ordersError,
    recentOrders,
    statsError,
    stats: buildStats(orders, dishes, claims),
  };
}
