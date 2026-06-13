import axios from "axios";

import type {
  CouponDish,
  RestaurantCoupon,
  RestaurantCouponApiResponse,
  RestaurantCouponRequest,
  RestaurantCouponsResponse,
} from "@/lib/restaurant/coupon/types";
import { clientApi as api } from "@/services/shared/api-client";

type CouponErrorResponse = {
  error?: string;
  message?: string;
  detail?: string;
};

type DishApiResponse = {
  id: number;
  nombre: string;
};

type CouponMutationResponse = {
  mensaje?: string;
  id?: number;
};

function mapApiDish(dish: DishApiResponse): CouponDish {
  return {
    id: String(dish.id),
    name: dish.nombre,
  };
}

function mapApiCoupon(
  coupon: RestaurantCouponApiResponse,
  availableDishes: CouponDish[],
): RestaurantCoupon {
  const couponDishes =
    coupon.platos?.map((dish) => ({
      id: String(dish.id),
      name: dish.nombre,
    })) ??
    coupon.idPlatos
      ?.map((dishId) =>
        availableDishes.find((dish) => dish.id === String(dishId)),
      )
      .filter((dish): dish is CouponDish => Boolean(dish)) ??
    [];

  return {
    id: String(coupon.id),
    code: coupon.codigo,
    description: coupon.descripcion ?? "",
    percentage: coupon.porcentaje,
    status: coupon.estado && coupon.eliminacion === null ? "active" : "inactive",
    createdAt: coupon.creacion,
    expiresAt: coupon.vencimiento,
    dishes: couponDishes,
  };
}

function normalizeApiDateTime(value: string) {
  const trimmedValue = value.trim();

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmedValue)) {
    return `${trimmedValue}:00`;
  }

  return trimmedValue;
}

function mapCouponRequest(
  coupon: RestaurantCoupon,
  options: { includeStatus?: boolean } = {},
): RestaurantCouponRequest {
  const request: RestaurantCouponRequest = {
    codigo: coupon.code.trim(),
    descripcion: coupon.description.trim(),
    porcentaje: coupon.percentage,
    vencimiento: normalizeApiDateTime(coupon.expiresAt),
    idPlatos: coupon.dishes.map((dish) => Number(dish.id)),
  };

  if (options.includeStatus) {
    request.estado = coupon.status === "active";
  }

  return request;
}

function getCouponErrorMessage(error: unknown, fallbackMessage: string) {
  if (!axios.isAxiosError<CouponErrorResponse>(error)) {
    return fallbackMessage;
  }

  const data = error.response?.data;
  return data?.error ?? data?.message ?? data?.detail ?? fallbackMessage;
}

export async function getRestaurantCoupons(
  restaurantId: string,
): Promise<RestaurantCouponsResponse> {
  const [couponsResponse, dishesResponse] = await Promise.all([
    api.get<RestaurantCouponApiResponse[]>(
      `/api/cupones/local/${restaurantId}`,
    ),
    api.get<DishApiResponse[]>("/api/platos", {
      params: { idLocal: restaurantId },
    }),
  ]);

  const availableDishes = dishesResponse.data.map(mapApiDish);

  return {
    restaurantId,
    coupons: couponsResponse.data.map((coupon) =>
      mapApiCoupon(coupon, availableDishes),
    ),
    availableDishes,
  };
}

export async function createRestaurantCoupon(
  _restaurantId: string,
  coupon: RestaurantCoupon,
): Promise<CouponMutationResponse> {
  try {
    const response = await api.post<CouponMutationResponse>(
      "/api/cupones",
      mapCouponRequest(coupon),
    );
    return response.data;
  } catch (error) {
    throw new Error(getCouponErrorMessage(error, "No se pudo crear el cupon."));
  }
}

export async function updateRestaurantCoupon(
  _restaurantId: string,
  coupon: RestaurantCoupon,
): Promise<CouponMutationResponse> {
  try {
    const response = await api.patch<CouponMutationResponse>(
      `/api/cupones/${coupon.id}`,
      mapCouponRequest(coupon, { includeStatus: true }),
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getCouponErrorMessage(error, "No se pudo guardar el cupon."),
    );
  }
}

export async function deleteRestaurantCoupon(
  _restaurantId: string,
  couponId: string,
): Promise<CouponMutationResponse> {
  try {
    const response = await api.delete<CouponMutationResponse>(
      `/api/cupones/${couponId}`,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getCouponErrorMessage(error, "No se pudo eliminar el cupon."),
    );
  }
}
