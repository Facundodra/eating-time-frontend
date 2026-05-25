export type OrderStatus =
  | "PENDIENTE_CONFIRMACION_LOCAL"
  | "ACEPTADO_LOCAL"
  | "EN_CURSO_LOCAL"
  | "EN_CAMINO_LOCAL"
  | "FINALIZADO"
  | "RECHAZADO_LOCAL";

export type WorkbenchOrder = {
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

export type WorkbenchFilters = {
  orden?: "antiguedad" | "items";
  sentido?: "asc" | "desc";
  identificador?: string;
  rangoInicio?: string;
  rangoFin?: string;
};
