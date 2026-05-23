import axios, { AxiosError } from "axios";

import { publicApi } from "./api-client";
import type { LoginCredentials, LoginWebResponse } from "@/lib/auth/types";

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
