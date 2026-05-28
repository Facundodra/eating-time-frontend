export type OrderStatus =
  | "PENDIENTE_CONFIRMACION_LOCAL"
  | "ACEPTADO_LOCAL"
  | "EN_CURSO_LOCAL"
  | "EN_CAMINO_LOCAL"
  | "FINALIZADO"
  | "RECHAZADO_LOCAL";

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
  creacion: string;
  eliminacion: string | null;
};

export type WorkbenchOrder = {
  id: number;
  localId: number;
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
  createdAt: string;
  deletedAt: string | null;
};

export type WorkbenchFilters = {
  sortBy?: "antiguedad" | "items";
  direction?: "asc" | "desc";
  orderId?: string;
  startDateTime?: string;
  endDateTime?: string;
};
