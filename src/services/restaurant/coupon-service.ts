import type {
  RestaurantCoupon,
  RestaurantCouponsResponse,
} from "@/lib/restaurant/coupon/types";

const mockCoupons: Record<string, RestaurantCouponsResponse> = {
  "dev-restaurant": {
    restaurantId: "dev-restaurant",
    availableDishes: [
      { id: "1", name: "Pizza Muzzarella" },
      { id: "2", name: "Empanadas" },
      { id: "3", name: "Milanesa napolitana" },
      { id: "4", name: "Tiramisu clasico" },
    ],
    coupons: [
      {
        id: "1",
        code: "PIZZA20",
        description: "Promo para pizzas seleccionadas",
        percentage: 20,
        status: "active",
        createdAt: "2026-05-12T09:30:00",
        expiresAt: "2026-07-15T23:59:00",
        dishes: [{ id: "1", name: "Pizza Muzzarella" }],
      },
      {
        id: "2",
        code: "POSTRE15",
        description: "Descuento en postres",
        percentage: 15,
        status: "inactive",
        createdAt: "2026-05-01T11:45:00",
        expiresAt: "2026-06-20T23:59:00",
        dishes: [{ id: "4", name: "Tiramisu clasico" }],
      },
    ],
  },
};

function cloneCouponsResponse(response: RestaurantCouponsResponse) {
  return {
    ...response,
    availableDishes: response.availableDishes.map((dish) => ({ ...dish })),
    coupons: response.coupons.map((coupon) => ({
      ...coupon,
      dishes: coupon.dishes.map((dish) => ({ ...dish })),
    })),
  };
}

function getStore(restaurantId: string) {
  const fallback = mockCoupons["dev-restaurant"];

  if (!mockCoupons[restaurantId]) {
    mockCoupons[restaurantId] = {
      ...cloneCouponsResponse(fallback),
      restaurantId,
    };
  }

  return mockCoupons[restaurantId];
}

export async function getRestaurantCoupons(
  restaurantId: string,
): Promise<RestaurantCouponsResponse> {
  return cloneCouponsResponse(getStore(restaurantId));
}

export async function createRestaurantCoupon(
  restaurantId: string,
  coupon: RestaurantCoupon,
): Promise<void> {
  const store = getStore(restaurantId);

  if (store.coupons.some((item) => item.code === coupon.code)) {
    throw new Error("Ya existe un cupon con ese codigo.");
  }

  store.coupons = [
    {
      ...coupon,
      id: String(Date.now()),
      status: "active",
      createdAt: new Date().toISOString(),
      isNew: undefined,
    },
    ...store.coupons,
  ];
}

export async function updateRestaurantCoupon(
  restaurantId: string,
  coupon: RestaurantCoupon,
): Promise<void> {
  const store = getStore(restaurantId);

  store.coupons = store.coupons.map((item) =>
    item.id === coupon.id ? { ...coupon, isNew: undefined } : item,
  );
}

export async function deleteRestaurantCoupon(
  restaurantId: string,
  couponId: string,
): Promise<void> {
  const store = getStore(restaurantId);

  store.coupons = store.coupons.filter((item) => item.id !== couponId);
}
