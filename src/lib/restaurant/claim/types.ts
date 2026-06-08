export type ClaimStatus = "pending" | "in_review" | "resolved" | "rejected";
export type ClaimResolutionAction = "rejection" | "refund" | "voucher";

export type RestaurantClaim = {
  id: string;
  orderId: string;
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
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
};

export type ClaimOrder = {
  id: string;
  createdAt: string;
  status: string;
  customerName: string;
  customerEmail: string;
  deliveryAddress: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: ClaimOrderItem[];
};

export type RestaurantClaimDetail = {
  claim: RestaurantClaim;
  order: ClaimOrder;
};

export type RestaurantClaimsResponse = {
  restaurantId: string;
  claims: RestaurantClaim[];
};
