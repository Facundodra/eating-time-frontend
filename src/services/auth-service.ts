import axios, { AxiosError } from "axios";

import { publicApi } from "./api-client";
import type {
  LoginCredentials,
  LoginWebResponse,
  RegisterCredentials,
} from "@/lib/auth/types";

type LoginErrorResponse = {
  error?: string;
  message?: string;
  detail?: string;
};

type LocalConfirmationErrorResponse = {
  error?: string;
  message?: string;
  detail?: string;
};

const LOCAL_CONFIRMATION_ENDPOINTS = [
  "/api/auth/activar-cuenta-local",
  "/api/auth/confirmar-cuenta",
];

export class LoginError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "LoginError";
  }
}

export class LocalConfirmationError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "LocalConfirmationError";
  }
}

export type LocalConfirmationCredentials = {
  email?: string;
  codigo: string;
  password: string;
};

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

export async function confirmLocalAccount(
  credentials: LocalConfirmationCredentials,
): Promise<void> {
  if (!publicApi.defaults.baseURL) {
    throw new LocalConfirmationError(
      "No está configurada la URL del backend. Revisá NEXT_PUBLIC_API_URL o NEXT_PUBLIC_API_BASE_URL.",
    );
  }

  let lastError: AxiosError<LocalConfirmationErrorResponse> | null = null;

  for (const endpoint of LOCAL_CONFIRMATION_ENDPOINTS) {
    try {
      await publicApi.post(endpoint, credentials);
      return;
    } catch (error) {
      if (!axios.isAxiosError<LocalConfirmationErrorResponse>(error)) {
        throw new LocalConfirmationError(
          "No se pudo confirmar la cuenta. Intentalo nuevamente.",
        );
      }

      lastError = error;

      if (!isEndpointNotFound(error)) {
        break;
      }
    }
  }

  throw mapLocalConfirmationError(lastError);
}

function mapLoginError(error: AxiosError<LoginErrorResponse>) {
  const status = error.response?.status;
  const responseMessage = getErrorMessage(error.response?.data);

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

function mapLocalConfirmationError(
  error: AxiosError<LocalConfirmationErrorResponse> | null,
) {
  const status = error?.response?.status;
  const responseMessage = getErrorMessage(error?.response?.data);

  if (!error?.response) {
    return new LocalConfirmationError(
      "Error de red: no se pudo conectar con el backend para confirmar la cuenta.",
    );
  }

  if (status === 400) {
    return new LocalConfirmationError(
      responseMessage ?? "El código ingresado no es válido.",
      400,
    );
  }

  if (status === 404) {
    return new LocalConfirmationError(
      responseMessage ?? "No encontramos una solicitud aprobada con ese código.",
      404,
    );
  }

  if (status === 409) {
    return new LocalConfirmationError(
      responseMessage ?? "La cuenta ya fue confirmada o el código ya fue usado.",
      409,
    );
  }

  return new LocalConfirmationError(
    responseMessage ?? `No se pudo confirmar la cuenta (${status})`,
    status,
  );
}

function isEndpointNotFound(error: AxiosError<LocalConfirmationErrorResponse>) {
  const responseMessage = getErrorMessage(error.response?.data);

  return (
    error.response?.status === 404 &&
    (!responseMessage || responseMessage.toLowerCase() === "not found")
  );
}

function getErrorMessage(
  data?: LoginErrorResponse | LocalConfirmationErrorResponse,
) {
  return data?.message ?? data?.error ?? data?.detail;
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

  try {
    await publicApi.post("/api/auth/registro", body);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data;
      const message = data?.error ?? data?.message ?? `Error al registrar (${error.response?.status})`;
      throw new Error(message);
    }
    throw new Error("No se pudo registrar. Intentalo nuevamente.");
  }
}
