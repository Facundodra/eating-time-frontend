export type PuntoEntregaCredentials = {
  loc: string;
  street: string;
  number: string;
  apto: string;
  indications: string;
}

export type PuntoDeEntrega = {
  id: number;
  localidad: string;
  calle: string;
  numero: string;
  indicaciones: string | null;
  nroApto: string | null;
  creacion: string;
  clienteId: number;
};

export type RestaurantList = {
  id: number;
  name: string;
  description: string;
  address: string;
  url_photo: string;
  stars: number;
  state: boolean;
}