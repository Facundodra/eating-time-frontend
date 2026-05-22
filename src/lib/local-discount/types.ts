export type DiscountStatus = "active" | "inactive";

export type DiscountDish = {
  id: string;
  name: string;
};

export type LocalDiscount = {
  id: string;
  percentage: number;
  status: DiscountStatus;
  createdAt: string;
  expiresAt: string;
  dishes: DiscountDish[];
};

export type LocalDiscountsResponse = {
  localId: string;
  discounts: LocalDiscount[];
  availableDishes: DiscountDish[];
};
