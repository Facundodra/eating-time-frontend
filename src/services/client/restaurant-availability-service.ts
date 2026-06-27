import type { RestaurantList } from "@/lib/client/types";
import { getRestaurantAvailability } from "@/services/restaurant/availability-service";
import { getRestaurantServiceStatus } from "@/services/restaurant/service-status-service";

async function getEffectiveRestaurantState(restaurant: RestaurantList) {
  const [serviceStatusResult, availabilityResult] = await Promise.allSettled([
    getRestaurantServiceStatus(String(restaurant.id)),
    getRestaurantAvailability(String(restaurant.id)),
  ]);

  if (
    serviceStatusResult.status === "fulfilled" &&
    serviceStatusResult.value === false
  ) {
    return false;
  }

  if (availabilityResult.status === "fulfilled") {
    return availabilityResult.value;
  }

  return restaurant.state;
}

export async function applyRestaurantAvailability(
  restaurants: RestaurantList[],
): Promise<RestaurantList[]> {
  const results = await Promise.allSettled(
    restaurants.map(async (restaurant) => ({
      ...restaurant,
      state: await getEffectiveRestaurantState(restaurant),
    })),
  );

  return results.map((result, index) =>
    result.status === "fulfilled" ? result.value : restaurants[index],
  );
}
