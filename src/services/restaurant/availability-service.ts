import { clientApi as api } from "@/services/shared/api-client";

export const RESTAURANT_AVAILABILITY_REFRESH_EVENT =
  "restaurant-availability:refresh";

type RestaurantAvailabilityResponse = {
  disponible: boolean;
};

export async function getRestaurantAvailability(
  restaurantId: string,
): Promise<boolean> {
  const response = await api.get<RestaurantAvailabilityResponse>(
    `/api/local/${restaurantId}/disponibilidad`,
  );

  return response.data.disponible;
}

export function notifyRestaurantAvailabilityRefresh() {
  window.dispatchEvent(new Event(RESTAURANT_AVAILABILITY_REFRESH_EVENT));
}
