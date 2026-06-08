import type {
  ClaimOrder,
  RestaurantClaim,
  RestaurantClaimDetail,
  RestaurantClaimsResponse,
} from "@/lib/restaurant/claim/types";

const mockOrders: Record<string, ClaimOrder> = {
  "8421": {
    id: "8421",
    createdAt: "2026-06-05T19:34:00",
    status: "Finalizado",
    customerName: "Sofia Martinez",
    customerEmail: "sofia.martinez@gmail.com",
    deliveryAddress: "Av. Italia 3245, Montevideo",
    paymentMethod: "Tarjeta",
    subtotal: 1490,
    deliveryFee: 120,
    total: 1610,
    items: [
      {
        id: "1",
        name: "Pizza Muzzarella",
        quantity: 1,
        unitPrice: 920,
      },
      {
        id: "2",
        name: "Bebida 1.5L",
        quantity: 1,
        unitPrice: 570,
        notes: "No fue enviada.",
      },
    ],
  },
  "8398": {
    id: "8398",
    createdAt: "2026-06-04T20:41:00",
    status: "Finalizado",
    customerName: "Mateo Rodriguez",
    customerEmail: "mateo.rodriguez@gmail.com",
    deliveryAddress: "Bv. Artigas 1280, Montevideo",
    paymentMethod: "Efectivo",
    subtotal: 1240,
    deliveryFee: 140,
    total: 1380,
    items: [
      {
        id: "3",
        name: "Milanesa napolitana",
        quantity: 1,
        unitPrice: 1240,
        notes: "El cliente indico que llego frio.",
      },
    ],
  },
  "8312": {
    id: "8312",
    createdAt: "2026-06-02T12:58:00",
    status: "Finalizado",
    customerName: "Camila Perez",
    customerEmail: "camila.perez@gmail.com",
    deliveryAddress: "Soriano 941, Montevideo",
    paymentMethod: "Tarjeta",
    subtotal: 980,
    deliveryFee: 120,
    total: 1100,
    items: [
      {
        id: "4",
        name: "Milanesa napolitana",
        quantity: 1,
        unitPrice: 980,
        notes: "Se envio una milanesa comun.",
      },
    ],
  },
  "8284": {
    id: "8284",
    createdAt: "2026-06-01T21:22:00",
    status: "Finalizado",
    customerName: "Juan Silva",
    customerEmail: "juan.silva@gmail.com",
    deliveryAddress: "Colonia 1467, Montevideo",
    paymentMethod: "Efectivo",
    subtotal: 450,
    deliveryFee: 110,
    total: 560,
    items: [
      {
        id: "5",
        name: "Papas fritas",
        quantity: 1,
        unitPrice: 450,
      },
    ],
  },
};

const mockClaims: Record<string, RestaurantClaimsResponse> = {
  "dev-restaurant": {
    restaurantId: "dev-restaurant",
    claims: [
      {
        id: "1",
        orderId: "8421",
        customerName: "Sofia Martinez",
        customerEmail: "sofia.martinez@gmail.com",
        reason: "Pedido incompleto",
        detail:
          "El pedido llego sin las bebidas incluidas. El cliente solicita una compensacion.",
        status: "pending",
        createdAt: "2026-06-05T20:14:00",
        updatedAt: "2026-06-05T20:14:00",
        amount: 690,
        response: "",
        resolutionAction: null,
        voucherAmount: null,
      },
      {
        id: "2",
        orderId: "8398",
        customerName: "Mateo Rodriguez",
        customerEmail: "mateo.rodriguez@gmail.com",
        reason: "Demora en la entrega",
        detail:
          "El pedido demoro mas de 70 minutos y llego frio. El cliente pide revision del caso.",
        status: "in_review",
        createdAt: "2026-06-04T22:03:00",
        updatedAt: "2026-06-05T09:20:00",
        amount: 1240,
        response: "Estamos revisando el tiempo de preparacion y entrega.",
        resolutionAction: null,
        voucherAmount: null,
      },
      {
        id: "3",
        orderId: "8312",
        customerName: "Camila Perez",
        customerEmail: "camila.perez@gmail.com",
        reason: "Producto incorrecto",
        detail:
          "Se envio una milanesa comun en lugar de una napolitana. Se genero compensacion.",
        status: "resolved",
        createdAt: "2026-06-02T13:42:00",
        updatedAt: "2026-06-02T15:10:00",
        amount: 980,
        response: "Se aprobo la compensacion por el error en el plato enviado.",
        resolutionAction: "voucher",
        voucherAmount: 300,
      },
      {
        id: "4",
        orderId: "8284",
        customerName: "Juan Silva",
        customerEmail: "juan.silva@gmail.com",
        reason: "Reclamo duplicado",
        detail:
          "El reclamo ya habia sido atendido desde soporte y no correspondia nueva accion.",
        status: "rejected",
        createdAt: "2026-06-01T21:55:00",
        updatedAt: "2026-06-02T10:30:00",
        amount: 450,
        response: "Se rechazo por tratarse de un reclamo ya resuelto.",
        resolutionAction: "rejection",
        voucherAmount: null,
      },
    ],
  },
};

function cloneClaimsResponse(response: RestaurantClaimsResponse) {
  return {
    ...response,
    claims: response.claims.map((claim) => ({ ...claim })),
  };
}

function getStore(restaurantId: string) {
  const fallback = mockClaims["dev-restaurant"];

  if (!mockClaims[restaurantId]) {
    mockClaims[restaurantId] = {
      ...cloneClaimsResponse(fallback),
      restaurantId,
    };
  }

  return mockClaims[restaurantId];
}

export async function getRestaurantClaims(
  restaurantId: string,
): Promise<RestaurantClaimsResponse> {
  return cloneClaimsResponse(getStore(restaurantId));
}

export async function getRestaurantClaimDetail(
  restaurantId: string,
  claimId: string,
): Promise<RestaurantClaimDetail> {
  const claim = getStore(restaurantId).claims.find((item) => item.id === claimId);

  if (!claim) {
    throw new Error("No se encontro el reclamo solicitado.");
  }

  const order = mockOrders[claim.orderId];

  if (!order) {
    throw new Error("No se encontro el pedido asociado al reclamo.");
  }

  return {
    claim: { ...claim },
    order: {
      ...order,
      items: order.items.map((item) => ({ ...item })),
    },
  };
}

export async function updateRestaurantClaim(
  restaurantId: string,
  claim: RestaurantClaim,
): Promise<void> {
  const store = getStore(restaurantId);

  store.claims = store.claims.map((item) =>
    item.id === claim.id
      ? { ...claim, updatedAt: new Date().toISOString() }
      : item,
  );
}
