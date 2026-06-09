import type {
  RestaurantDashboardData,
  RestaurantDashboardOrder,
  RestaurantDashboardStat,
} from "@/lib/restaurant/dashboard/types";
import type { OrderStatus, WorkbenchOrder } from "@/lib/restaurant/workbench/types";
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
    customerLabel: `Cliente #${order.customerId}`,
    status: order.status,
    statusLabel: statusLabels[order.status],
    time: formatTime(order.createdAt),
    total: formatPrice(order.total),
  };
}

function buildStats(
  orders: WorkbenchOrder[],
  dishes: Awaited<ReturnType<typeof getRestaurantDishes>>["dishes"],
): RestaurantDashboardStat[] {
  const activeOrders = orders.filter((order) => activeStatuses.has(order.status));
  const todayRevenue = orders
    .filter(
      (order) =>
        isToday(order.createdAt) &&
        order.status !== "RECHAZADO_LOCAL" &&
        order.status !== "CANCELADO_CLIENTE",
    )
    .reduce((total, order) => total + order.total, 0);
  const availableDishes = dishes.filter((dish) => dish.status === "available");

  return [
    {
      label: "Pedidos activos",
      value: activeOrders.length.toString(),
      tag: "Ahora",
      tone: "amber",
    },
    {
      label: "Ingresos del dia",
      value: formatPrice(todayRevenue),
      tag: "Hoy",
      tone: "emerald",
    },
    {
      label: "Platos publicados",
      value: dishes.length.toString(),
      tag: "Menu",
      tone: "slate",
    },
    {
      label: "Platos disponibles",
      value: availableDishes.length.toString(),
      tag: "Activos",
      tone: "emerald",
    },
  ];
}

export async function getRestaurantDashboardData(
  restaurantId: string,
): Promise<RestaurantDashboardData> {
  const [ordersResult, dishesResult] = await Promise.allSettled([
    fetchWorkbenchOrders(restaurantId, {
      direction: "desc",
      sortBy: "antiguedad",
    }),
    getRestaurantDishes(restaurantId),
  ]);

  const orders =
    ordersResult.status === "fulfilled" ? ordersResult.value : [];
  const dishes =
    dishesResult.status === "fulfilled" ? dishesResult.value.dishes : [];
  const ordersError =
    ordersResult.status === "rejected"
      ? ordersResult.reason instanceof Error
        ? ordersResult.reason.message
        : "No se pudieron cargar los pedidos."
      : null;
  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5)
    .map(mapRecentOrder);

  return {
    ordersError,
    recentOrders,
    stats: buildStats(orders, dishes),
  };
}
