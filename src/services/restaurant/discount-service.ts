import type { RestaurantDiscountsResponse } from "@/lib/restaurant/discount/types";

const bypassDiscounts: Record<string, RestaurantDiscountsResponse> = {
  "dev-restaurant": {
    restaurantId: "dev-restaurant",
    availableDishes: [
      { id: "pumpkin-ravioli", name: "Ravioles de calabaza" },
      { id: "mushroom-risotto", name: "Risotto de hongos" },
      { id: "napolitan-milanesa", name: "Milanesa napolitana" },
      { id: "classic-tiramisu", name: "Tiramisu clasico" },
    ],
    discounts: [
      {
        id: "discount-1",
        percentage: 20,
        status: "active",
        createdAt: "2026-05-12 09:30",
        expiresAt: "2026-06-15 23:59",
        dishes: [
          { id: "pumpkin-ravioli", name: "Ravioles de calabaza" },
          { id: "mushroom-risotto", name: "Risotto de hongos" },
        ],
      },
      {
        id: "discount-2",
        percentage: 15,
        status: "active",
        createdAt: "2026-05-10 14:15",
        expiresAt: "2026-05-28 23:59",
        dishes: [{ id: "napolitan-milanesa", name: "Milanesa napolitana" }],
      },
      {
        id: "discount-3",
        percentage: 30,
        status: "inactive",
        createdAt: "2026-05-01 11:45",
        expiresAt: "2026-05-20 23:59",
        dishes: [{ id: "classic-tiramisu", name: "Tiramisu clasico" }],
      },
    ],
  },
};

export async function getRestaurantDiscounts(
  restaurantId: string,
): Promise<RestaurantDiscountsResponse> {
  // TODO: Replace this bypass with GET api/locals/{id}/discounts.
  // Expected future shape:
  // const response = await fetch(`${process.env.API_URL}/api/locals/${restaurantId}/discounts`);
  // return response.json();
  return getRestaurantDiscountsWithBypass(restaurantId);
}

export async function getRestaurantDiscountsWithBypass(
  restaurantId: string,
): Promise<RestaurantDiscountsResponse> {
  const fallback = bypassDiscounts["dev-restaurant"];

  return bypassDiscounts[restaurantId] ?? { ...fallback, restaurantId };
}
