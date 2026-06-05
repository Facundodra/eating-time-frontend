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
  isNew?: boolean;
};

export type RestaurantDiscountsResponse = {
  restaurantId: string;
  discounts: RestaurantDiscount[];
  availableDishes: DiscountDish[];
};

export type RestaurantDiscountApiDish = {
  id: number;
  nombre: string;
};

export type RestaurantDiscountApiResponse = {
  id: number;
  porcentaje: number;
  estado: boolean;
  creacion: string;
  vencimiento: string;
  eliminacion: string | null;
  platos: RestaurantDiscountApiDish[];
};

export type RestaurantDiscountRequest = {
  porcentaje: number;
  vencimiento: string;
  idPlatos: number[];
};
