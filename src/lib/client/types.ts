import { DishStatus } from "../local-dish/types";

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