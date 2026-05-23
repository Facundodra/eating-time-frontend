export type UserRole = "admin" | "restaurant" | "client";

export type BackendUserRole = "ADMIN" | "LOCAL" | "CLIENTE";

export type AuthUser = {
  id: string;
  roleId?: string;
  name: string;
  email: string;
  role: UserRole;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginWebResponse = {
  tipoUsuario: BackendUserRole;
  idUsuario: number;
  idTipoUsuario: number;
};

export type AuthSession = {
  user: AuthUser;
};
