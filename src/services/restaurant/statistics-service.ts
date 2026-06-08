import axios from "axios";

import type {
  DishSalesEvolutionApiResponse,
  OrderStatusApiResponse,
  PopularityRatingApiResponse,
  PromotionsApiResponse,
  RestaurantStatistics,
  RevenueApiResponse,
  StatisticsFilters,
  TopSellingDishesApiResponse,
} from "@/lib/restaurant/statistics/types";
import { toApiDateTime } from "@/lib/restaurant/statistics/utils";
import { clientApi } from "@/services/shared/api-client";
import { requireCurrentSession } from "@/services/shared/auth-service";

type StatisticsErrorResponse = {
  error?: string;
  message?: string;
  detail?: string;
};

function getErrorMessage(data: unknown) {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const payload = data as StatisticsErrorResponse;
  return payload.message ?? payload.error ?? payload.detail;
}

function buildRangeParams(filters: StatisticsFilters) {
  const params = new URLSearchParams();

  if (filters.from) {
    params.set("desde", toApiDateTime(filters.from));
  }

  if (filters.to) {
    params.set("hasta", toApiDateTime(filters.to));
  }

  if (filters.limit != null) {
    params.set("limite", String(filters.limit));
  }

  if (filters.granularity) {
    params.set("granularidad", filters.granularity);
  }

  return params;
}

async function getRestaurantId() {
  const session = await requireCurrentSession();
  return String(session.idTipoUsuario);
}

function mapStatisticsResponse(
  topSellingDishes: TopSellingDishesApiResponse,
  dishSalesEvolution: DishSalesEvolutionApiResponse,
  revenue: RevenueApiResponse,
  orderStatus: OrderStatusApiResponse,
  promotions: PromotionsApiResponse,
  popularityRating: PopularityRatingApiResponse,
): RestaurantStatistics {
  return {
    topSellingDishes: {
      from: topSellingDishes.desde,
      to: topSellingDishes.hasta,
      items: topSellingDishes.items.map((item) => ({
        dishId: item.platoId,
        name: item.nombre,
        quantitySold: item.cantidadVendida,
        revenue: item.ingresos,
      })),
    },
    dishSalesEvolution: {
      from: dishSalesEvolution.desde,
      to: dishSalesEvolution.hasta,
      granularity: dishSalesEvolution.granularidad,
      series: dishSalesEvolution.series.map((series) => ({
        dishId: series.platoId,
        name: series.nombre,
        points: series.puntos.map((point) => ({
          period: point.periodo,
          quantity: point.cantidad,
          revenue: point.ingresos,
        })),
      })),
    },
    revenue: {
      from: revenue.desde,
      to: revenue.hasta,
      granularity: revenue.granularidad,
      periodTotal: revenue.totalPeriodo,
      points: revenue.puntos.map((point) => ({
        period: point.periodo,
        revenue: point.ingresos,
        orders: point.pedidos,
      })),
    },
    orderStatus: {
      date: orderStatus.fecha,
      total: orderStatus.total,
      slices: orderStatus.slices.map((slice) => ({
        category: slice.categoria,
        label: slice.etiqueta,
        count: slice.cantidad,
      })),
    },
    promotions: {
      from: promotions.desde,
      to: promotions.hasta,
      items: promotions.items.map((item) => ({
        type: item.tipo,
        promotionId: item.promocionId,
        code: item.codigo,
        percentage: item.porcentaje,
        uses: item.usos,
        discountedAmount: item.montoDescontado,
      })),
    },
    popularityRating: {
      from: popularityRating.desde,
      to: popularityRating.hasta,
      globalRestaurantRating: popularityRating.valoracionLocalGlobal,
      items: popularityRating.items.map((item) => ({
        dishId: item.platoId,
        name: item.nombre,
        quantitySold: item.cantidadVendida,
        averageRating: item.valoracionPromedio,
        ratedOrders: item.pedidosCalificados,
      })),
    },
  };
}

export async function fetchRestaurantStatistics(
  filters: StatisticsFilters,
): Promise<RestaurantStatistics> {
  const restaurantId = await getRestaurantId();
  const rangeParams = buildRangeParams(filters);
  const rangeQuery = rangeParams.toString();

  const orderStatusParams = new URLSearchParams();
  if (filters.orderStatusDate) {
    orderStatusParams.set("fecha", filters.orderStatusDate);
  }

  const orderStatusQuery = orderStatusParams.toString();

  try {
    const [
      topSellingDishesResponse,
      dishSalesEvolutionResponse,
      revenueResponse,
      orderStatusResponse,
      promotionsResponse,
      popularityRatingResponse,
    ] = await Promise.all([
      clientApi.get<TopSellingDishesApiResponse>(
        `/api/local/${restaurantId}/estadisticas/platos-mas-vendidos${rangeQuery ? `?${rangeQuery}` : ""}`,
      ),
      clientApi.get<DishSalesEvolutionApiResponse>(
        `/api/local/${restaurantId}/estadisticas/ventas-por-plato${rangeQuery ? `?${rangeQuery}` : ""}`,
      ),
      clientApi.get<RevenueApiResponse>(
        `/api/local/${restaurantId}/estadisticas/ingresos${rangeQuery ? `?${rangeQuery}` : ""}`,
      ),
      clientApi.get<OrderStatusApiResponse>(
        `/api/local/${restaurantId}/estadisticas/pedidos-estado${orderStatusQuery ? `?${orderStatusQuery}` : ""}`,
      ),
      clientApi.get<PromotionsApiResponse>(
        `/api/local/${restaurantId}/estadisticas/promociones${rangeQuery ? `?${rangeQuery}` : ""}`,
      ),
      clientApi.get<PopularityRatingApiResponse>(
        `/api/local/${restaurantId}/estadisticas/popularidad-valoracion${rangeQuery ? `?${rangeQuery}` : ""}`,
      ),
    ]);

    return mapStatisticsResponse(
      topSellingDishesResponse.data,
      dishSalesEvolutionResponse.data,
      revenueResponse.data,
      orderStatusResponse.data,
      promotionsResponse.data,
      popularityRatingResponse.data,
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = getErrorMessage(error.response?.data);
      throw new Error(
        message ?? `Error al cargar estadísticas (${error.response?.status})`,
      );
    }

    throw new Error("No se pudieron cargar las estadísticas.");
  }
}
