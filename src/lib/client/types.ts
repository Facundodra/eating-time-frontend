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