import type { DishStatus } from "@/lib/restaurant/dish/types";

export type DeliveryPointCredentials = {
  loc: string;
  street: string;
  number: string;
  apto: string;
  indications: string;
}

export type DeliveryPoint = {
  id: number;
  localidad: string;
  calle: string;
  numero: string;
  indicaciones: string | null;
  nroApto: string | null;
  creacion: string;
  clienteId: number;
};

export type ClientDish = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  status: DishStatus;
  createdAt: string;
  localId: number;
  categories: number[];
}

export type ClientDishCategory = {
  id: number;
  name: string;
  imageUrl: string | null;
}

export type ClientDishCategorySummary = ClientDishCategory & {
  dishCount: number;
}

export type Discount = {
  id: number;
  porcentaje: number;
  estado: boolean;
}

export type ClientVoucher = {
  id: string;
  code: string;
  description: string;
  amount: number | null;
  createdAt: string | null;
  expiresAt: string | null;
  claimId?: number | null;
  orderId?: number | null;
  restaurantName?: string | null;
  status?: string | null;
}

export type ClientCoupon = {
  id: string;
  code: string;
  description: string;
  percentage: number | null;
  createdAt: string | null;
  expiresAt: string | null;
  restaurantName?: string | null;
  status?: string | null;
}

export type RestaurantList = {
  id: number;
  name: string;
  coverPhotoUrl: string;
  profilePhotoUrl: string;
  stars: number;
  state: boolean;
}

export type Restaurant ={
  id: number;
  name: string;
  coverPhotoUrl: string;
  profilePhotoUrl: string;
  stars: number;
  state: boolean;
  address: string | null;
  description: string | null;
}

// Estados posibles del pedido relevantes para el cliente
export type OrderStatus = "EN_CARRITO" | "ETAPA_DE_PAGO" | "PENDIENTE_CONFIRMACION_LOCAL";

// Body del PATCH para realizar pedido — punto guardado o dirección manual
export type OrderRequest =
  | { puntoDeEntregaId: number; notasLocal?: string }
  | {
      localidad: string;
      calle: string;
      numero: string;
      nroApto?: string;
      indicaciones?: string;
      guardarEnCuenta?: boolean;
      notasLocal?: string;
    };

export type PaymentResponse = {
  linkPago: string;
};

// Estado devuelto por Mercado Pago en el callback
export type PaymentStatus = "approved" | "failure" | "pending";

export type OrderRatingValue =
  | "1_ESTRELLA"
  | "2_ESTRELLAS"
  | "3_ESTRELLAS"
  | "4_ESTRELLAS"
  | "5_ESTRELLAS";

export type OrderRating = {
  id?: number;
  pedidoId: number;
  calificacion: OrderRatingValue | string;
  comentario: string | null;
  creacion?: string | null;
};

export type CartItem = {
  id: number;
  pedidoId: number;
  platoId: number;
  nombre?: string;
  descuentoId: number | null;
  cantidad: number;
  costoUnitario: number;
  descuentoAplicado: number;
  total: number;
  creacion: string;
  eliminacion: string | null;
};

export type AppliedCartCoupon = {
  code: string;
  percentage: number;
  discountAmount: number;
};

export type Cart = {
  id: number;
  restaurantId: number;
  clienteId: number;
  cuponId: number | null;
  cuponCodigo: string | null;
  cuponPorcentaje: number | null;
  voucherId: number | null;
  estado: OrderStatus;
  total: number;
  descuento: number | null;
  tiempoEstimado: number | null;
  urlFactura: string | null;
  comentario: string | null;
  direccion: string | null;
  indicaciones: string | null;
  motivoRechazo: string | null;
  creacion: string;
  eliminacion: string | null;
  items: CartItem[];
};

// Estados de un pedido que aparecen en el historial del cliente (pedidos realizados).
export type OrderHistoryStatus =
  | "PENDIENTE_CONFIRMACION_LOCAL"
  | "ACEPTADO_LOCAL"
  | "EN_CURSO_LOCAL"
  | "EN_CAMINO_LOCAL"
  | "FINALIZADO"
  | "RECHAZADO_LOCAL"
  | "CANCELADO_CLIENTE";

// Pedido cerrado del historial del cliente (mapea PedidoDto del backend)
export type Order = {
  id: number;
  restaurantId: number;
  restaurantName?: string | null;
  clienteId: number;
  cuponId: number | null;
  estado: OrderHistoryStatus;
  total: number;
  descuento: number | null;
  tiempoEstimado: string | null;
  urlFactura: string | null;
  comentario: string | null;
  direccion: string | null;
  indicaciones: string | null;
  motivoRechazo: string | null;
  creacion: string;
  eliminacion: string | null;
  items: CartItem[];
  calificacionLocal: OrderRating | null;
  hasLocalRating: boolean;
};

export type OrderClaimStatus = "PENDIENTE" | "APROBADO" | "RECHAZADO";

export type OrderClaim = {
  id: number;
  pedidoId: number;
  descripcion: string;
  nota: string | null;
  estado: OrderClaimStatus;
  creacion: string;
  localId?: number;
  localNombre?: string | null;
  pedidoTotal?: number | null;
  voucherId?: string | null;
  voucherCode?: string | null;
  voucherAmount?: number | null;
  voucherExpiresAt?: string | null;
};

// Calificación de local
export type LocalRating = {
  id: number;
  clienteId?: number | null;
  calificacion: number;
  comentario: string | null;
  creacion: string;
  pedidoId: number;
  nombreCliente: string;
}
