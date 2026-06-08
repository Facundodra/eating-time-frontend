import axios from "axios";

import type {
  DiscountDish,
  RestaurantDiscount,
  RestaurantDiscountApiResponse,
  RestaurantDiscountRequest,
  RestaurantDiscountsResponse,
} from "@/lib/restaurant/discount/types";
import { clientApi } from "@/services/shared/api-client";

type DiscountErrorResponse = {
  error?: string;
  message?: string;
  detail?: string;
};

type DishApiResponse = {
  id: number;
  nombre: string;
};

type DiscountMutationResponse = {
  mensaje: string;
  id?: number;
};

function mapApiDiscount(
  discount: RestaurantDiscountApiResponse,
): RestaurantDiscount {
  return {
    id: String(discount.id),
    percentage: discount.porcentaje,
    status: discount.estado && discount.eliminacion === null ? "active" : "inactive",
    createdAt: discount.creacion,
    expiresAt: discount.vencimiento,
    dishes: discount.platos.map((dish) => ({
      id: String(dish.id),
      name: dish.nombre,
    })),
  };
}

function mapApiDish(dish: DishApiResponse): DiscountDish {
  return {
    id: String(dish.id),
    name: dish.nombre,
  };
}

function mapDiscountRequest(
  discount: RestaurantDiscount,
  options: { includeStatus?: boolean } = {},
): RestaurantDiscountRequest {
  const request: RestaurantDiscountRequest = {
    porcentaje: discount.percentage,
    vencimiento: normalizeApiDateTime(discount.expiresAt),
    idPlatos: discount.dishes.map((dish) => Number(dish.id)),
  };

  if (options.includeStatus) {
    request.estado = discount.status === "active";
  }

  return request;
}

function normalizeApiDateTime(value: string) {
  const trimmedValue = value.trim();

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmedValue)) {
    return `${trimmedValue}:00`;
  }

  return trimmedValue;
}

function getDiscountErrorMessage(error: unknown, fallbackMessage: string) {
  if (!axios.isAxiosError<DiscountErrorResponse>(error)) {
    return fallbackMessage;
  }

  const data = error.response?.data;
  return data?.error ?? data?.message ?? data?.detail ?? fallbackMessage;
}

export async function getRestaurantDiscounts(
  restaurantId: string,
): Promise<RestaurantDiscountsResponse> {
  const [discountsResponse, dishesResponse] = await Promise.all([
    clientApi.get<RestaurantDiscountApiResponse[]>(
      `/api/local/${restaurantId}/descuentos`,
    ),
    clientApi.get<DishApiResponse[]>("/api/platos", {
      params: { idLocal: restaurantId },
    }),
  ]);

  return {
    restaurantId,
    discounts: discountsResponse.data.map(mapApiDiscount),
    availableDishes: dishesResponse.data.map(mapApiDish),
  };
}

export async function createRestaurantDiscount(
  discount: RestaurantDiscount,
): Promise<DiscountMutationResponse> {
  try {
    const response = await clientApi.post<DiscountMutationResponse>(
      "/api/descuentos",
      mapDiscountRequest(discount),
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getDiscountErrorMessage(error, "No se pudo crear el descuento."),
    );
  }
}

export async function updateRestaurantDiscount(
  discount: RestaurantDiscount,
): Promise<DiscountMutationResponse> {
  try {
    const response = await clientApi.patch<DiscountMutationResponse>(
      `/api/descuentos/${discount.id}`,
      mapDiscountRequest(discount, { includeStatus: true }),
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getDiscountErrorMessage(error, "No se pudo guardar el descuento."),
    );
  }
}

export async function deleteRestaurantDiscount(
  discountId: string,
): Promise<DiscountMutationResponse> {
  try {
    const response = await clientApi.delete<DiscountMutationResponse>(
      `/api/descuentos/${discountId}`,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getDiscountErrorMessage(error, "No se pudo eliminar el descuento."),
    );
  }
}
