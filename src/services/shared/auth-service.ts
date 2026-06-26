import axios, { AxiosError } from "axios";

import {
  clientApi as client,
  publicApi as api,
} from "@/services/shared/api-client";
import type {
  LoginCredentials,
  LoginWebResponse,
  RegisterCredentials,
} from "@/lib/shared/auth/types";

type LoginErrorResponse = {
  error?: string;
  message?: string;
  detail?: string;
};

type RestaurantConfirmationErrorResponse = {
  error?: string;
  message?: string;
  detail?: string;
};

const RESTAURANT_CONFIRMATION_ENDPOINTS = [
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

export class RestaurantConfirmationError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "RestaurantConfirmationError";
  }
}

export type RestaurantConfirmationCredentials = {
  email?: string;
  codigo: string;
  password: string;
};

export async function login(
  credentials: LoginCredentials,
): Promise<LoginWebResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw mapLoginFetchError(response.status, await getFetchErrorMessage(response));
  }

  return (await response.json()) as LoginWebResponse;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    cache: "no-store",
  });
}

// Fuente de verdad de sesión en cliente: el backend identifica al usuario por
// JSESSIONID y /api/auth/me devuelve el rol e ids actuales. No se persiste nada
// en sessionStorage/localStorage del frontend.
export async function getCurrentSession(): Promise<LoginWebResponse | null> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
  });

  if (response.status === 401) {
    redirectToLoginWhenSessionExpires();
    return null;
  }

  if (!response.ok) {
    throw new Error("No se pudo obtener la sesión.");
  }

  return (await response.json()) as LoginWebResponse;
}

function redirectToLoginWhenSessionExpires() {
  if (typeof window === "undefined") {
    return;
  }

  const isPrivateRoute =
    window.location.pathname.startsWith("/admin") ||
    window.location.pathname.startsWith("/client") ||
    window.location.pathname.startsWith("/restaurant");

  if (!isPrivateRoute) {
    return;
  }

  window.location.assign("/login?reason=session-expired");
}

export async function requireCurrentSession(): Promise<LoginWebResponse> {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error("Sesión no encontrada");
  }

  return session;
}

// Variante para Server Components/layouts: recibe el header Cookie ya leido por
// el adaptador server y valida esa sesión contra el mismo endpoint del backend.
export async function getSessionFromCookieHeader(
  cookieHeader: string,
): Promise<LoginWebResponse | null> {
  if (!api.defaults.baseURL || !cookieHeader) {
    return null;
  }

  const response = await fetch(`${api.defaults.baseURL}/api/auth/me`, {
    method: "GET",
    cache: "no-store",
    headers: {
      cookie: cookieHeader,
    },
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("No se pudo obtener la sesión.");
  }

  return (await response.json()) as LoginWebResponse;
}

export async function confirmRestaurantAccount(
  credentials: RestaurantConfirmationCredentials,
): Promise<void> {
  if (!api.defaults.baseURL) {
    throw new RestaurantConfirmationError(
      "No está configurada la URL del backend. Revisá NEXT_PUBLIC_API_URL o NEXT_PUBLIC_API_BASE_URL.",
    );
  }

  let lastError: AxiosError<RestaurantConfirmationErrorResponse> | null = null;

  for (const endpoint of RESTAURANT_CONFIRMATION_ENDPOINTS) {
    try {
      await api.post(endpoint, credentials);
      return;
    } catch (error) {
      if (!axios.isAxiosError<RestaurantConfirmationErrorResponse>(error)) {
        throw new RestaurantConfirmationError(
          "No se pudo confirmar la cuenta. Intentalo nuevamente.",
        );
      }

      lastError = error;

      if (!isEndpointNotFound(error)) {
        break;
      }
    }
  }

  throw mapRestaurantConfirmationError(lastError);
}

async function getFetchErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const data = (await response.json()) as LoginErrorResponse | string;
      return typeof data === "string" ? data : getErrorMessage(data);
    }

    const text = await response.text();
    return text.trim() || undefined;
  } catch {
    return undefined;
  }
}

function mapLoginFetchError(status: number, responseMessage?: string) {
  if (status === 400) {
    return new LoginError(responseMessage ?? "Revisa los datos ingresados.", 400);
  }

  if (status === 401) {
    return new LoginError("Credenciales incorrectas", 401);
  }

  if (status === 403) {
    return new LoginError(responseMessage ?? "No tenes permiso para ingresar.", 403);
  }

  return new LoginError(
    responseMessage ?? "No se pudo iniciar sesión. Intentalo nuevamente.",
    status,
  );
}

function mapRestaurantConfirmationError(
  error: AxiosError<RestaurantConfirmationErrorResponse> | null,
) {
  const status = error?.response?.status;
  const responseMessage = getErrorMessage(error?.response?.data);

  if (!error?.response) {
    return new RestaurantConfirmationError(
      "Error de red: no se pudo conectar con el backend para confirmar la cuenta.",
    );
  }

  if (status === 400) {
    return new RestaurantConfirmationError(
      responseMessage ?? "El código ingresado no es válido.",
      400,
    );
  }

  if (status === 404) {
    return new RestaurantConfirmationError(
      responseMessage ?? "No encontramos una solicitud aprobada con ese código.",
      404,
    );
  }

  if (status === 409) {
    return new RestaurantConfirmationError(
      responseMessage ?? "La cuenta ya fue confirmada o el código ya fue usado.",
      409,
    );
  }

  return new RestaurantConfirmationError(
    responseMessage ?? `No se pudo confirmar la cuenta (${status})`,
    status,
  );
}

function isEndpointNotFound(error: AxiosError<RestaurantConfirmationErrorResponse>) {
  const responseMessage = getErrorMessage(error.response?.data);

  return (
    error.response?.status === 404 &&
    (!responseMessage || responseMessage.toLowerCase() === "not found")
  );
}

function getErrorMessage(
  data?: LoginErrorResponse | RestaurantConfirmationErrorResponse,
) {
  return data?.message ?? data?.error ?? data?.detail;
}

export async function resetPassword(email: string): Promise<void> {
  await api.post("/api/auth/recuperar-password", { email });
}

export class PasswordResetError extends Error {
  constructor(
    message: string,
    public readonly code: "invalid" | "expired" | "validation",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "PasswordResetError";
  }
}

export async function confirmPasswordReset(
  token: string,
  nuevaPassword: string,
): Promise<void> {
  try {
    await api.post("/api/auth/restablecer-password", {
      token,
      nuevaPassword,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 404) {
        throw new PasswordResetError("El enlace no es válido.", "invalid", 404);
      }
      if (status === 410) {
        throw new PasswordResetError(
          "El enlace expiró o ya fue utilizado. Solicitá uno nuevo.",
          "expired",
          410,
        );
      }
      if (status === 400) {
        const msg =
          error.response?.data?.nuevaPassword ??
          error.response?.data?.message ??
          "La contraseña no es válida.";
        throw new PasswordResetError(msg, "validation", 400);
      }
    }
    throw new PasswordResetError(
      "No se pudo restablecer la contraseña. Intentalo nuevamente.",
      "invalid",
    );
  }
}


export class ChangePasswordError extends Error {
  constructor(
    message: string,
    public readonly code: "wrong_password" | "validation" | "unauthorized",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ChangePasswordError";
  }
}

export async function changePassword(
  passwordActual: string,
  nuevaPassword: string,
): Promise<void> {
  try {
    await client.patch("/api/auth/cambiar-password", {
      passwordActual,
      nuevaPassword,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 400) {
        const msg =
          error.response?.data?.error ??
          error.response?.data?.nuevaPassword ??
          "Revisá los datos ingresados.";
        throw new ChangePasswordError(msg, "wrong_password", 400);
      }
      if (status === 401) {
        throw new ChangePasswordError("Tu sesión expiró.", "unauthorized", 401);
      }
    }
    throw new ChangePasswordError(
      "No se pudo cambiar la contraseña. Intentalo nuevamente.",
      "wrong_password",
    );
  }
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
    await api.post("/api/auth/registro", body);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data;
      const message = data?.error ?? data?.message ?? `Error al registrar (${error.response?.status})`;
      throw new Error(message);
    }
    throw new Error("No se pudo registrar. Intentalo nuevamente.");
  }
}


// Editar datos usuario
export async function editUserData(nombre?: string, telefono?: string, foto?: File | null): Promise<void> {
  const body = new FormData();
  body.append("nombre", nombre ?? "");
  body.append("telefono", telefono ?? "");

  if (foto instanceof File && foto.size > 0) {
    body.append("foto", foto, foto.name);
  }

  try {
    await client.patch("/api/local/editar", body);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401) {
        throw new Error("Tu sesión expiró." );
      }

      if (status === 413) {
        throw new Error("La foto supera el tamaño máximo permitido de 5 MB.");
      }

      const data = error.response?.data as LoginErrorResponse | string | undefined;
      const message = typeof data === "string" ? data : getErrorMessage(data);
      if (message) {
        throw new Error(message);
      }
    }
    throw new Error(
      "No se pudo editar el usuario. Intentalo nuevamente."
    );
  }
}
