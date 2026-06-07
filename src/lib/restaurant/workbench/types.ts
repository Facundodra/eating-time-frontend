export type OrderStatus =
  | "PENDIENTE_CONFIRMACION_LOCAL"
  | "ACEPTADO_LOCAL"
  | "EN_CURSO_LOCAL"
  | "EN_CAMINO_LOCAL"
  | "FINALIZADO"
  | "RECHAZADO_LOCAL"
  | "CANCELADO_CLIENTE";

// States that should be visible in the workbench. Excludes transient
// pre-payment states (EN_CARRITO, PENDIENTE_APROBACION_PAGO) that the
// backend may still return but the local has no action on.
export const WORKBENCH_VISIBLE_STATUSES = new Set<string>([
  "PENDIENTE_CONFIRMACION_LOCAL",
  "ACEPTADO_LOCAL",
  "EN_CURSO_LOCAL",
  "EN_CAMINO_LOCAL",
  "FINALIZADO",
  "RECHAZADO_LOCAL",
  "CANCELADO_CLIENTE",
]);

export type OrderItemApiResponse = {
  id: number;
  pedidoId: number;
  platoId: number;
  nombre: string;
  descuentoId: number | null;
  cantidad: number;
  costoUnitario: number;
  descuentoAplicado: number;
  total: number;
  creacion: string;
  eliminacion: string | null;
};

export type OrderItem = {
  id: number;
  orderId: number;
  dishId: number;
  name: string;
  discountId: number | null;
  quantity: number;
  unitCost: number;
  discountApplied: number;
  total: number;
  createdAt: string;
  deletedAt: string | null;
};

export type WorkbenchOrderApiResponse = {
  id: number;
  localId: number;
  clienteId: number;
  cuponId: number | null;
  estado: OrderStatus;
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
  items: OrderItemApiResponse[];
};

export type WorkbenchOrder = {
  id: number;
  restaurantId: number;
  customerId: number;
  couponId: number | null;
  status: OrderStatus;
  total: number;
  discount: number | null;
  estimatedTime: string | null;
  invoiceUrl: string | null;
  comment: string | null;
  address: string | null;
  instructions: string | null;
  rejectionReason: string | null;
  createdAt: string;
  deletedAt: string | null;
  items: OrderItem[];
};

export type WorkbenchFilters = {
  sortBy?: "antiguedad" | "items";
  direction?: "asc" | "desc";
  orderId?: string;
  startDateTime?: string;
  endDateTime?: string;
};
