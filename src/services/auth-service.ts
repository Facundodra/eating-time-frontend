import type { AuthUser, LoginCredentials } from "@/lib/auth/types";

export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  // TODO: Replace this bypass with the real authentication API call.
  // Expected future shape:
  // const response = await fetch(`${process.env.API_URL}/auth/login`, { ... });
  // return response.user;
  return loginWithBypass(credentials);
}

const bypassUsers: Record<string, AuthUser> = {
  "admin@eatingtime.uy": {
    id: "dev-admin",
    name: "Admin",
    email: "admin@eatingtime.uy",
    role: "admin",
  },
  "restaurant@eatingtime.uy": {
    id: "dev-restaurant",
    name: "Local gastronómico",
    email: "restaurant@eatingtime.uy",
    role: "restaurant",
  },
  "client@eatingtime.uy": {
    id: "dev-client",
    name: "Cliente",
    email: "client@eatingtime.uy",
    role: "client",
  },
};

export async function loginWithBypass({
  email,
}: LoginCredentials): Promise<AuthUser> {
  const normalizedEmail = email.trim().toLowerCase();

  return (
    bypassUsers[normalizedEmail] ?? {
      id: "dev-client",
      name: "Cliente",
      email: normalizedEmail || "client@eatingtime.uy",
      role: "client",
    }
  );
}
