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
import { buildPromotionDisplayLabel, toApiDateTime } from "@/lib/restaurant/statistics/utils";
import type { RestaurantCoupon } from "@/lib/restaurant/coupon/types";
import type { RestaurantDiscount } from "@/lib/restaurant/discount/types";
import { getRestaurantCoupons } from "@/services/restaurant/coupon-service";
import { getRestaurantDiscounts } from "@/services/restaurant/discount-service";
import { clientApi as api } from "@/services/shared/api-client";
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

export async function getRestaurantRating(
  restaurantId: number | string,
): Promise<number | null> {
  try {
    const response = await api.get<PopularityRatingApiResponse>(
      `/api/local/${encodeURIComponent(restaurantId)}/estadisticas/popularidad-valoracion`,
    );
    const rating = response.data.valoracionLocalGlobal;

    return rating == null || !Number.isFinite(Number(rating))
      ? null
      : Number(rating);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = getErrorMessage(error.response?.data);
      throw new Error(
        message ?? `Error al cargar la calificación (${error.response?.status})`,
      );
    }

    throw new Error("No se pudo cargar la calificación del local.");
  }
}

function mapStatisticsResponse(
  topSellingDishes: TopSellingDishesApiResponse,
  dishSalesEvolution: DishSalesEvolutionApiResponse,
  revenue: RevenueApiResponse,
  orderStatus: OrderStatusApiResponse,
  promotions: PromotionsApiResponse,
  popularityRating: PopularityRatingApiResponse,
  promotionLookups?: {
    discountsById: Map<number, RestaurantDiscount>;
    couponsById: Map<number, RestaurantCoupon>;
  },
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
      items: promotions.items.map((item) => {
        const discount = promotionLookups?.discountsById.get(item.promocionId);
        const coupon = promotionLookups?.couponsById.get(item.promocionId);

        return {
          type: item.tipo,
          promotionId: item.promocionId,
          code: item.codigo,
          percentage: item.porcentaje,
          uses: item.usos,
          discountedAmount: item.montoDescontado,
          label: buildPromotionDisplayLabel(
            {
              type: item.tipo,
              promotionId: item.promocionId,
              code: item.codigo,
              percentage: item.porcentaje,
            },
            {
              discountDishes: discount?.dishes.map((dish) => dish.name),
              couponCode: coupon?.code ?? item.codigo,
              couponDescription: coupon?.description,
            },
          ),
        };
      }),
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
      discountsResult,
      couponsResult,
    ] = await Promise.all([
      api.get<TopSellingDishesApiResponse>(
        `/api/local/${restaurantId}/estadisticas/platos-mas-vendidos${rangeQuery ? `?${rangeQuery}` : ""}`,
      ),
      api.get<DishSalesEvolutionApiResponse>(
        `/api/local/${restaurantId}/estadisticas/ventas-por-plato${rangeQuery ? `?${rangeQuery}` : ""}`,
      ),
      api.get<RevenueApiResponse>(
        `/api/local/${restaurantId}/estadisticas/ingresos${rangeQuery ? `?${rangeQuery}` : ""}`,
      ),
      api.get<OrderStatusApiResponse>(
        `/api/local/${restaurantId}/estadisticas/pedidos-estado${orderStatusQuery ? `?${orderStatusQuery}` : ""}`,
      ),
      api.get<PromotionsApiResponse>(
        `/api/local/${restaurantId}/estadisticas/promociones${rangeQuery ? `?${rangeQuery}` : ""}`,
      ),
      api.get<PopularityRatingApiResponse>(
        `/api/local/${restaurantId}/estadisticas/popularidad-valoracion${rangeQuery ? `?${rangeQuery}` : ""}`,
      ),
      getRestaurantDiscounts(restaurantId).catch(() => null),
      getRestaurantCoupons(restaurantId).catch(() => null),
    ]);

    const discountsById = new Map(
      (discountsResult?.discounts ?? []).map((discount) => [
        Number(discount.id),
        discount,
      ]),
    );
    const couponsById = new Map(
      (couponsResult?.coupons ?? []).map((coupon) => [Number(coupon.id), coupon]),
    );

    return mapStatisticsResponse(
      topSellingDishesResponse.data,
      dishSalesEvolutionResponse.data,
      revenueResponse.data,
      orderStatusResponse.data,
      promotionsResponse.data,
      popularityRatingResponse.data,
      { discountsById, couponsById },
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
