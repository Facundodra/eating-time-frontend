import type { BackendUserRole } from "@/lib/auth/types";

export type AccountProfile = {
  idUsuario: number;
  idTipoUsuario: number;
  tipoUsuario: BackendUserRole;
  nombre: string;
  email: string;
  telefono: string;
  documento: string;
  direccion: string;
  descripcion: string;
};

export type UpdateAccountProfileInput = {
  nombre: string;
  email: string;
  telefono: string;
  direccion?: string;
  descripcion?: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};
