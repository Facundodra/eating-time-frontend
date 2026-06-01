import axios, { AxiosError } from "axios";

import type {
  AccountProfile,
  ChangePasswordInput,
  UpdateAccountProfileInput,
} from "@/lib/account/types";
import type { BackendUserRole, LoginWebResponse } from "@/lib/shared/auth/types";
import { getStoredSession } from "@/lib/shared/auth/session-store";

import { api } from "@/services/shared/api-client";

type BackendErrorResponse = {
  error?: string;
  message?: string;
  detail?: string;
};

type BackendProfileResponse = Partial<{
  id: number;
  idUsuario: number;
  usuarioId: number;
  idTipoUsuario: number;
  localId: number;
  clienteId: number;
  adminId: number;
  tipoUsuario: BackendUserRole;
  nombre: string;
  name: string;
  email: string;
  correo: string;
  telefono: string;
  phone: string;
  cedula: string;
  documento: string;
  direccion: string;
  descripcion: string;
  calificacion: number;
  promedioCalificacion: number;
  rating: number;
  puntuacion: number;
}>;

const roleLabels: Record<BackendUserRole, string> = {
  ADMIN: "administrador",
  LOCAL: "local",
  CLIENTE: "cliente",
};

function requireSession(): LoginWebResponse {
  const session = getStoredSession();

  if (!session) {
    throw new Error("No encontramos una sesión activa. Iniciá sesión nuevamente.");
  }

  return session;
}

function getProfileEndpoints(session: LoginWebResponse) {
  const userId = encodeURIComponent(String(session.idUsuario));
  const roleId = encodeURIComponent(String(session.idTipoUsuario));

  if (session.tipoUsuario === "LOCAL") {
    return [
      `/api/local/${roleId}`,
      `/api/usuarios/${userId}`,
    ];
  }

  if (session.tipoUsuario === "CLIENTE") {
    return [
      `/api/clientes/${roleId}`,
      `/api/cliente/${roleId}`,
      `/api/usuarios/${userId}`,
    ];
  }

  return [
    `/api/admin/${roleId}`,
    `/api/administradores/${roleId}`,
    `/api/usuarios/${userId}`,
  ];
}

function getPasswordEndpoints(session: LoginWebResponse) {
  const userId = encodeURIComponent(String(session.idUsuario));

  return [
    `/api/usuarios/${userId}/cambiar-contrasena`,
    `/api/usuarios/${userId}/password`,
    "/api/auth/change-password",
  ];
}

function mapProfile(
  data: BackendProfileResponse | null,
  session: LoginWebResponse,
): AccountProfile {
  const rating =
    data?.calificacion ??
    data?.promedioCalificacion ??
    data?.rating ??
    data?.puntuacion ??
    null;

  return {
    idUsuario: data?.idUsuario ?? data?.usuarioId ?? session.idUsuario,
    idTipoUsuario:
      data?.idTipoUsuario ??
      data?.localId ??
      data?.clienteId ??
      data?.adminId ??
      data?.id ??
      session.idTipoUsuario,
    tipoUsuario: data?.tipoUsuario ?? session.tipoUsuario,
    nombre: data?.nombre ?? data?.name ?? "",
    email: data?.email ?? data?.correo ?? "",
    telefono: data?.telefono ?? data?.phone ?? "",
    documento: data?.documento ?? data?.cedula ?? "",
    direccion: data?.direccion ?? "",
    descripcion: data?.descripcion ?? "",
    rating,
  };
}

function getUpdatePayload(input: UpdateAccountProfileInput) {
  return {
    nombre: input.nombre.trim(),
    email: input.email.trim().toLowerCase(),
    telefono: input.telefono.trim(),
    ...(input.direccion !== undefined
      ? { direccion: input.direccion.trim() }
      : {}),
    ...(input.descripcion !== undefined
      ? { descripcion: input.descripcion.trim() }
      : {}),
  };
}

function getPasswordPayload(input: ChangePasswordInput) {
  return {
    passwordActual: input.currentPassword,
    nuevaPassword: input.newPassword,
  };
}

function getErrorMessage(error: AxiosError<BackendErrorResponse>) {
  const data = error.response?.data;

  return data?.message ?? data?.error ?? data?.detail;
}

function isEndpointNotFound(error: AxiosError<BackendErrorResponse>) {
  return error.response?.status === 404;
}

function toServiceError(
  error: AxiosError<BackendErrorResponse> | null,
  fallback: string,
) {
  if (!error?.response) {
    return new Error("No se pudo conectar con el servidor. Intentá nuevamente.");
  }

  return new Error(getErrorMessage(error) ?? fallback);
}

async function tryRequest<T>(
  endpoints: string[],
  request: (endpoint: string) => Promise<T>,
  fallback: string,
) {
  let lastError: AxiosError<BackendErrorResponse> | null = null;

  for (const endpoint of endpoints) {
    try {
      return await request(endpoint);
    } catch (error) {
      if (!axios.isAxiosError<BackendErrorResponse>(error)) {
        throw new Error(fallback);
      }

      lastError = error;

      if (!isEndpointNotFound(error)) {
        break;
      }
    }
  }

  throw toServiceError(lastError, fallback);
}

export function getAccountRoleLabel(role: BackendUserRole) {
  return roleLabels[role];
}

export async function getAccountProfile(): Promise<AccountProfile> {
  const session = requireSession();

  return tryRequest(
    getProfileEndpoints(session),
    async (endpoint) => {
      const response = await api.get<BackendProfileResponse>(endpoint);
      return mapProfile(response.data, session);
    },
    "No se pudieron cargar tus datos.",
  );
}

export async function updateAccountProfile(
  input: UpdateAccountProfileInput,
): Promise<AccountProfile> {
  const session = requireSession();

  return tryRequest(
    getProfileEndpoints(session),
    async (endpoint) => {
      const response = await api.patch<BackendProfileResponse>(
        endpoint,
        getUpdatePayload(input),
      );

      return mapProfile(response.data, session);
    },
    "No se pudieron actualizar tus datos.",
  );
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  const session = requireSession();

  await tryRequest(
    getPasswordEndpoints(session),
    async (endpoint) => {
      await api.patch(endpoint, getPasswordPayload(input));
    },
    `No se pudo cambiar la contraseña de la cuenta ${roleLabels[session.tipoUsuario]}.`,
  );
}
