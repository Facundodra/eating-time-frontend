import axios, { AxiosError } from "axios";

import { publicApi } from "./api-client";
import type {
  LoginCredentials,
  LoginWebResponse,
  RegisterCredentials,
} from "@/lib/auth/types";

type LoginErrorResponse = {
  error?: string;
};

export class LoginError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "LoginError";
  }
}

export async function login(
  credentials: LoginCredentials,
): Promise<LoginWebResponse> {
  try {
    const response = await publicApi.post<LoginWebResponse>(
      "/api/auth/login-web",
      credentials,
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError<LoginErrorResponse>(error)) {
      throw mapLoginError(error);
    }

    throw new LoginError("No se pudo iniciar sesion. Intentalo nuevamente.");
  }
}

export async function logout(): Promise<void> {
  await publicApi.post("/api/auth/logout", { isMobile: false });
}

function mapLoginError(error: AxiosError<LoginErrorResponse>) {
  const status = error.response?.status;
  const responseMessage = error.response?.data?.error;

  if (status === 400) {
    return new LoginError(responseMessage ?? "Revisa los datos ingresados.", 400);
  }

  if (status === 401) {
    return new LoginError("Credenciales incorrectas", 401);
  }

  if (status === 403) {
    return new LoginError(responseMessage ?? "No tenes permiso para ingresar.", 403);
  }

  return new LoginError("No se pudo iniciar sesion. Intentalo nuevamente.", status);
}

export async function register(credentials: RegisterCredentials): Promise<void> {
  const body = new FormData();
  body.append("nombre", credentials.name);
  body.append("email", credentials.email);
  body.append("cedula", credentials.document);
  body.append("password", credentials.password);

  if (credentials.phone) {
    body.append("telefono", credentials.phone);
  }

  if (
    credentials.profile_pic instanceof File &&
    credentials.profile_pic.size > 0
  ) {
    body.append("foto", credentials.profile_pic);
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/auth/registro`,
    { method: "POST", body },
  );

  if (!response.ok) {
    let errorMessage = `Error al registrar (${response.status})`;

    try {
      const data = await response.json();
      errorMessage = data.error ?? data.message ?? errorMessage;
    } catch {
      // API did not return JSON.
    }

    throw new Error(errorMessage);
  }
}
