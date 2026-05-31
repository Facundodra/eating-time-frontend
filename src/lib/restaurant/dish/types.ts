export type DishStatus = "available" | "unavailable";

export type RestaurantDish = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  status: DishStatus;
  createdAt: string;
};

export type RestaurantDishesResponse = {
  restaurantId: string;
  dishes: RestaurantDish[];
};
