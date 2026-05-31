export type DiscountStatus = "active" | "inactive";

export type DiscountDish = {
  id: string;
  name: string;
};

export type RestaurantDiscount = {
  id: string;
  percentage: number;
  status: DiscountStatus;
  createdAt: string;
  expiresAt: string;
  dishes: DiscountDish[];
};

export type RestaurantDiscountsResponse = {
  restaurantId: string;
  discounts: RestaurantDiscount[];
  availableDishes: DiscountDish[];
};
