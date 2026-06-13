export type ClaimStatus = "pending" | "resolved" | "rejected";
export type ClaimResolutionAction = "rejection" | "voucher";

export type RestaurantClaim = {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  detail: string;
  status: ClaimStatus;
  createdAt: string;
  updatedAt: string;
  amount: number;
  response: string;
  resolutionAction: ClaimResolutionAction | null;
  voucherAmount: number | null;
};

export type ClaimOrderItem = {
  id: string;
  dishName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type ClaimOrder = {
  id: string;
  createdAt: string;
  status: string;
  total: number;
  items: ClaimOrderItem[];
};

export type ClaimVoucher = {
  id: string;
  code: string;
  description: string;
  amount: number;
  createdAt: string;
  expiresAt: string;
};

export type RestaurantClaimDetail = {
  claim: RestaurantClaim;
  order: ClaimOrder;
  voucher: ClaimVoucher | null;
};

export type RestaurantClaimsResponse = {
  restaurantId: string;
  claims: RestaurantClaim[];
};
