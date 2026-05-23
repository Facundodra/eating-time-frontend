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

export type RegisterCredentials = {
  name: string;
  document: string;
  phone: string;
  email: string;
  password: string;
  profile_pic: File | string;  
};