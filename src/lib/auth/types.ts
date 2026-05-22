export type UserRole = "admin" | "restaurant" | "client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthSession = {
  user: AuthUser;
};
