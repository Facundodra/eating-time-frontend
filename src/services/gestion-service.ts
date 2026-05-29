import type { SolicitudRegistroLocalInput } from "@/lib/gestion/types";

export type SolicitudRegistroResponse = {
  fechaSolicitud: string;
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  direccion: string;
  descripcion: string | null;
  fotosDeReferencia: string[];
  creacion: string;
  aceptacion?: string | null;
  rechazo?: string | null;
  estado?: "PENDIENTE" | "APROBADA" | "ACEPTADA" | "RECHAZADA" | null;
  tipoComida?: string | null;
};

export type ConfirmarCuentaLocalInput = {
  email?: string;
  codigo: string;
  password: string;
};

export class SolicitudRegistroError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "SolicitudRegistroError";
  }
}

export class CuentaLocalYaConfirmadaError extends Error {
  constructor() {
    super(
      "Esta cuenta ya fue confirmada anteriormente. Podés iniciar sesión con tu contraseña.",
    );
    this.name = "CuentaLocalYaConfirmadaError";
  }
}

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    ""
  ).replace(/\/$/, "");
}

function assertApiBaseUrl(apiBaseUrl: string): void {
  if (!apiBaseUrl) {
    throw new SolicitudRegistroError(
      "No está configurada la URL del backend. Revisá NEXT_PUBLIC_API_URL o NEXT_PUBLIC_API_BASE_URL.",
    );
  }
}

async function getBackendErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const data = (await response.json()) as {
        message?: string;
        error?: string;
        detail?: string;
      };

      return data.message ?? data.error ?? data.detail ?? fallback;
    }

    const text = await response.text();
    return text.trim() || fallback;
  } catch {
    return fallback;
  }
}

export async function obtenerSolicitudesRegistroLocal(): Promise<
  SolicitudRegistroResponse[]
> {
  const apiBaseUrl = getApiBaseUrl();
  assertApiBaseUrl(apiBaseUrl);

  const url = `${apiBaseUrl}/api/gestion/solicitudes`;
  //const url = `${apiBaseUrl}/api/gestion/solicitudes/pendientes`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });
  } catch {
    throw new SolicitudRegistroError(
      `Error de red al obtener solicitudes: no se pudo conectar con ${url}.`,
    );
  }

  if (!response.ok) {
    const errorMessage = await getBackendErrorMessage(
      response,
      `Error al obtener solicitudes (${response.status})`,
    );

    throw new SolicitudRegistroError(errorMessage, response.status);
  }

  return (await response.json()) as SolicitudRegistroResponse[];
}

export async function obtenerSolicitudRegistroLocalPorId(
  id: number,
): Promise<SolicitudRegistroResponse> {
  const apiBaseUrl = getApiBaseUrl();
  assertApiBaseUrl(apiBaseUrl);

  const url = `${apiBaseUrl}/api/gestion/solicitudes/${encodeURIComponent(
    id.toString(),
  )}`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });
  } catch {
    throw new SolicitudRegistroError(
      `Error de red al obtener la solicitud: no se pudo conectar con ${url}.`,
    );
  }

  if (!response.ok) {
    const errorMessage = await getBackendErrorMessage(
      response,
      `Error al obtener la solicitud (${response.status})`,
    );

    throw new SolicitudRegistroError(errorMessage, response.status);
  }

  return (await response.json()) as SolicitudRegistroResponse;
}

export async function enviarSolicitudRegistroLocal(
  input: SolicitudRegistroLocalInput,
): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();
  assertApiBaseUrl(apiBaseUrl);

  const url = `${apiBaseUrl}/api/gestion/solicitud-registro`;
  const body = new FormData();

  body.append("nombre", input.nombre.trim());
  body.append("descripcion", input.descripcion.trim());
  body.append("email", input.email.trim().toLowerCase());
  body.append("direccion", input.direccion.trim());
  body.append("telefono", input.telefono.trim());

  for (const file of input.fotos) {
    if (file.size > 0) {
      body.append("fotos", file);
    }
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      body,
      credentials: "include",
    });
  } catch {
    throw new SolicitudRegistroError(
      `Error de red al enviar la solicitud: no se pudo conectar con ${url}.`,
    );
  }

  if (!response.ok) {
    let errorMessage = await getBackendErrorMessage(
      response,
      `Error al enviar la solicitud (${response.status})`,
    );

    if (response.status === 409 && errorMessage === "Conflict") {
      errorMessage =
        "Ya existe una solicitud o una cuenta registrada con esos datos.";
    }

    if (response.status === 413) {
      errorMessage =
        "Las imágenes superan el tamaño permitido. Usá archivos más livianos o menos fotos.";
    }

    throw new SolicitudRegistroError(errorMessage, response.status);
  }
}

export async function aprobarSolicitudRegistroLocal(
  id: number,
): Promise<void> {
  await actualizarEstadoSolicitudRegistroLocal(id, "aprobar");
}

export async function rechazarSolicitudRegistroLocal(
  id: number,
): Promise<void> {
  await actualizarEstadoSolicitudRegistroLocal(id, "rechazar");
}

async function actualizarEstadoSolicitudRegistroLocal(
  id: number,
  action: "aprobar" | "rechazar",
): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();
  assertApiBaseUrl(apiBaseUrl);

  const url = `${apiBaseUrl}/api/gestion/solicitudes/${encodeURIComponent(
    id.toString(),
  )}/${action}`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: "PATCH",
      credentials: "include",
    });
  } catch {
    throw new SolicitudRegistroError(
      `Error de red al ${action} la solicitud: no se pudo conectar con ${url}.`,
    );
  }

  if (!response.ok) {
    const errorMessage = await getBackendErrorMessage(
      response,
      `Error al ${action} la solicitud (${response.status})`,
    );

    throw new SolicitudRegistroError(errorMessage, response.status);
  }
}

export async function confirmarCuentaLocal(
  input: ConfirmarCuentaLocalInput,
): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();
  assertApiBaseUrl(apiBaseUrl);

  const url = `${apiBaseUrl}/api/auth/activar-cuenta-local`;
  const body = {
    ...(input.email ? { email: input.email.trim().toLowerCase() } : {}),
    codigo: input.codigo.trim(),
    password: input.password,
  };

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new SolicitudRegistroError(
      `Error de red al confirmar cuenta: no se pudo conectar con ${url}.`,
    );
  }

  if (!response.ok) {
    if (response.status === 409) {
      throw new CuentaLocalYaConfirmadaError();
    }

    const errorMessage = await getBackendErrorMessage(
      response,
      `Error al confirmar la cuenta (${response.status})`,
    );

    throw new SolicitudRegistroError(errorMessage, response.status);
  }
}
