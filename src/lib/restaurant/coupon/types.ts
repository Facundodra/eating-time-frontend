export type CouponStatus = "active" | "inactive";

export type CouponDish = {
  id: string;
  name: string;
};

export type RestaurantCoupon = {
  id: string;
  code: string;
  description: string;
  percentage: number;
  status: CouponStatus;
  createdAt: string;
  expiresAt: string;
  dishes: CouponDish[];
  isNew?: boolean;
};

export type RestaurantCouponsResponse = {
  restaurantId: string;
  coupons: RestaurantCoupon[];
  availableDishes: CouponDish[];
};

export type RestaurantCouponApiDish = {
  id: number;
  nombre: string;
};

export type RestaurantCouponApiResponse = {
  id: number;
  codigo: string;
  descripcion: string | null;
  porcentaje: number;
  estado: boolean;
  creacion: string;
  vencimiento: string;
  eliminacion: string | null;
  localId: number;
  platos: RestaurantCouponApiDish[];
  idPlatos?: number[];
};

export type RestaurantCouponRequest = {
  codigo: string;
  descripcion?: string;
  porcentaje: number;
  vencimiento: string;
  idPlatos: number[];
  estado?: boolean;
};
