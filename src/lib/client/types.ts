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

export type ClientDishStatus = "available" | "unavailable";

export type ClientDish = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  status: ClientDishStatus;
  createdAt: string;
  localId: number;
  categories: number[];
};

export type DishFilter = {
  idLocal?: number;
  precioMin?: number;
  precioMax?: number;
  q?: string;
  conDescuento?: boolean;
  orden?: "precio";
  sentido?: "asc" | "desc";
  pagina?: number;
  tamano?: number;
};

export type LocalList = {
  id: number;
  nombre: string;
  descripcion: string;
  direccion: string;
  url_foto: string;
  calificacion: number;
  estado_servicio: boolean;
};
