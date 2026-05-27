import type { SolicitudRegistroLocalInput } from "@/lib/gestion/types";

export class SolicitudRegistroError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "SolicitudRegistroError";
  }
}

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    ""
  );
}

export async function enviarSolicitudRegistroLocal(
  input: SolicitudRegistroLocalInput,
): Promise<void> {
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

  const response = await fetch(
    `${getApiBaseUrl()}/api/gestion/solicitud-registro`,
    { method: "POST", body },
  );

  if (!response.ok) {
    let errorMessage = `Error al enviar la solicitud (${response.status})`;
    const contentType = response.headers.get("content-type") ?? "";

    try {
      if (contentType.includes("application/json")) {
        const data = (await response.json()) as {
          message?: string;
          error?: string;
          detail?: string;
        };
        errorMessage =
          data.message ?? data.error ?? data.detail ?? errorMessage;
      } else {
        const text = await response.text();
        if (text.trim()) {
          errorMessage = text.trim();
        }
      }
    } catch {
      // API did not return a parseable body.
    }

    if (response.status === 409) {
      errorMessage =
        errorMessage ||
        "Campos ya registrados en otro local o solicitud pendiente";
    }

    if (response.status === 413) {
      errorMessage =
        "Las imágenes superan el tamaño permitido. Usá archivos de hasta 1 MB cada uno o menos fotos.";
    }

    throw new SolicitudRegistroError(errorMessage, response.status);
  }
}
