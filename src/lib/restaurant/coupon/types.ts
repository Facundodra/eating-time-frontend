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
