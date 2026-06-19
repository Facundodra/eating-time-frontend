export type BackendUserRole = "ADMIN" | "LOCAL" | "CLIENTE";

export type LoginCredentials = {
  email: string;
  password: string;
};

// Es la forma canónica de sesión para el frontend. Viene del backend en
// login-web y, principalmente, en GET /api/auth/me usando la cookie JSESSIONID.
export type LoginWebResponse = {
  tipoUsuario: BackendUserRole;
  idUsuario: number;
  idTipoUsuario: number;
  nombre?: string | null;
  correo?: string | null;
  email?: string | null;
  telefono?: string | null;
  urlFoto?: string | null;
  urlPortada?: string | null;
  urlFotoPortada?: string | null;
};

export type RegisterCredentials = {
  name: string;
  document: string;
  phone: string;
  email: string;
  password: string;
  profile_pic: File | string;  
};

