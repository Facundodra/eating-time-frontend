export type User = {
  usuarioId: number;
  nombre: string;
  email: string;
  telefono: string | null;
  creacion: Date;
  bloqueo: Date | null;
  eliminacion: Date | null;  
}

export type Client = User & {
  urlFoto: string | null;
  calificacion: number | null;
}

export type Restaurant = User & {
  urlFoto: string | null;
  calificacion: number | null;
  direccion: string | null;
  descripcion: string | null;
  estadoServicio: boolean;
}