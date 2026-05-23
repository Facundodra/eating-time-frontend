import type { AuthUser, LoginCredentials, RegisterCredentials } from "@/lib/auth/types";

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

export async function register(credentials: RegisterCredentials): Promise<void> {
  const body = new FormData();
  body.append("nombre", credentials.name);
  body.append("email", credentials.email);
  body.append("cedula", credentials.document);
  body.append("password", credentials.password);
  if (credentials.phone) body.append("telefono", credentials.phone);
  if (credentials.profile_pic instanceof File && credentials.profile_pic.size > 0)
    body.append("foto", credentials.profile_pic);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/auth/registro`,
    { method: "POST", body }
  );

  if (!response.ok) {
    let errorMessage = `Error al registrar (${response.status})`;
    try {
      const data = await response.json();
      errorMessage = data.error ?? data.message ?? errorMessage;
    } catch {
      // API didn't return JSON
    }
    throw new Error(errorMessage);
  }
}
