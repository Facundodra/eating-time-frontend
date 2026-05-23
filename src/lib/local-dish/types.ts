export type DishStatus = "available" | "unavailable";

export type LocalDish = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  status: DishStatus;
  createdAt: string;
};

export type LocalDishesResponse = {
  localId: string;
  dishes: LocalDish[];
};
