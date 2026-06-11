export type OrderStatus =
  | "EN_CARRITO"
  | "ETAPA_DE_PAGO"
  | "PENDIENTE_CONFIRMACION_LOCAL"
  | "ACEPTADO_LOCAL"
  | "EN_CURSO_LOCAL"
  | "EN_CAMINO_LOCAL"
  | "FINALIZADO"
  | "RECHAZADO_LOCAL"
  | "CANCELADO_CLIENTE";

export type WorkbenchRatingValue = 0 | 1;

export type WorkbenchOrderRating = {
  id?: number;
  pedidoId: number;
  calificacion: WorkbenchRatingValue;
  comentario: string | null;
  creacion?: string | null;
};

export type WorkbenchOrderApiResponse = {
  id?: number;
  pedidoId?: number;
  localId?: number;
  idLocal?: number;
  clienteId?: number;
  idCliente?: number;
  cuponId?: number | null;
  estado?: OrderStatus;
  estadoPedido?: OrderStatus;
  status?: OrderStatus;
  estadoPago?: OrderStatus;
  total?: number;
  montoTotal?: number;
  cantidadItems?: number;
  cantidadPlatos?: number;
  items?: WorkbenchOrderItemApiResponse[];
  detalles?: WorkbenchOrderItemApiResponse[];
  descuento?: number | null;
  tiempoEstimado?: string | null;
  urlFactura?: string | null;
  clienteNombre?: string | null;
  nombreCliente?: string | null;
  comentario?: string | null;
  direccion?: string | null;
  indicaciones?: string | null;
  motivoRechazo?: string | null;
  creacion?: string;
  fechaCreacion?: string;
  createdAt?: string;
  eliminacion?: string | null;
  calificacionCliente?: unknown;
  clienteCalificacion?: unknown;
  tieneCalificacionCliente?: unknown;
  calificadoCliente?: unknown;
  calificacionLocal?: unknown;
  localCalificacion?: unknown;
  tieneCalificacionLocal?: unknown;
  calificadoLocal?: unknown;
  tieneCalificacion?: unknown;
  calificado?: unknown;
  calificacion?: unknown;
  rating?: unknown;
};

export type WorkbenchOrderItemApiResponse = {
  id?: number;
  pedidoId?: number;
  platoId?: number;
  nombre?: string;
  nombrePlato?: string;
  platoNombre?: string;
  descuentoId?: number | null;
  cantidad?: number;
  costoUnitario?: number;
  precio?: number;
  descuentoAplicado?: number;
  total?: number;
  creacion?: string;
  eliminacion?: string | null;
};

export type WorkbenchOrderItem = {
  id: number;
  dishId: number | null;
  name: string;
  quantity: number;
  unitPrice: number | null;
  total: number | null;
  orderId?: number;
  discountId?: number | null;
  unitCost?: number | null;
  discountApplied?: number | null;
  createdAt?: string;
  deletedAt?: string | null;
};

export type WorkbenchOrder = {
  id: number;
  restaurantId: number;
  customerId: number;
  customerName: string | null;
  couponId: number | null;
  status: OrderStatus;
  total: number;
  itemCount: number;
  items: WorkbenchOrderItem[];
  discount: number | null;
  estimatedTime: string | null;
  invoiceUrl: string | null;
  comment: string | null;
  address: string | null;
  instructions: string | null;
  rejectionReason: string | null;
  createdAt: string;
  deletedAt: string | null;
  customerRating: WorkbenchOrderRating | null;
  hasCustomerRating: boolean;
};

export type WorkbenchFilters = {
  sortBy?: "antiguedad" | "items";
  direction?: "asc" | "desc";
  orderId?: string;
  startDateTime?: string;
  endDateTime?: string;
};
