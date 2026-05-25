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

export type LocalList = {
  id: number;
  nombre: string;
  descripcion: string;
  direccion: string;
  url_foto: string;
  califiacion: number;
  estado_servicio: boolean;
}