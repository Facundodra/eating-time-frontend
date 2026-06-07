export type DishStatus = "available" | "unavailable";

export type DishCategory = {
  id: string;
  name: string;
};

export type RestaurantDish = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  status: DishStatus;
  createdAt: string;
  categoryIds: string[];
};

export type RestaurantDishesResponse = {
  restaurantId: string;
  dishes: RestaurantDish[];
};
