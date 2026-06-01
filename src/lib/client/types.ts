import { DishStatus } from "../restaurant/dish/types";

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
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  status: DishStatus;
  createdAt: string;
  localId: number;
  categories: number[];
}

export type RestaurantList = {
  id: number;
  name: string;
  url_photo: string;
  stars: number;
  state: boolean;
}

export type LocalList = {
  id: number;
  nombre: string;
  direccion?: string | null;
  urlFoto?: string | null;
  estadoServicio?: boolean;
};

export type Restaurant ={
  id: number;
  name: string;
  url_photo: string;
  stars: number;
  state: boolean;
  address: string | null;
  description: string | null;
}

// Estados posibles del pedido relevantes para el cliente
export type OrderStatus = "EN_CARRITO" | "ETAPA_DE_PAGO" | "PENDIENTE_CONFIRMACION_LOCAL";

// Body del PATCH para realizar pedido — punto guardado o dirección manual
export type OrderRequest =
  | { puntoDeEntregaId: number }
  | {
      localidad: string;
      calle: string;
      numero: string;
      nroApto?: string;
      indicaciones?: string;
      guardarEnCuenta?: boolean;
    };

export type PaymentResponse = {
  linkPago: string;
};

// Estado devuelto por Mercado Pago en el callback
export type PaymentStatus = "approved" | "failure" | "pending";

export type CartItem = {
  id: number;
  pedidoId: number;
  platoId: number;
  descuentoId: number | null;
  cantidad: number;
  costoUnitario: number;
  descuentoAplicado: number;
  total: number;
  creacion: string;
  eliminacion: string | null;
};

export type Cart = {
  id: number;
  restaurantId: number;
  clienteId: number;
  cuponId: number | null;
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