import { clientApi as api } from "../shared/api-client";

type RestaurantServiceStatusResponse = {
  estadoServicio: boolean;
};

export async function getRestaurantServiceStatus(
  restaurantId: string,
): Promise<boolean> {
  const response = await api.get<RestaurantServiceStatusResponse>(
    `/api/local/${restaurantId}/estado`,
  );

  return response.data.estadoServicio;
}

export async function updateRestaurantServiceStatus(
  restaurantId: string,
  enabled: boolean,
): Promise<void> {
  await api.patch(`/api/local/${restaurantId}/estado`, {
    estadoServicio: enabled,
  });
}
