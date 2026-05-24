"use server";

import { enviarSolicitudRegistroLocal } from "@/services/gestion-service";

export type SolicitudRegistroState =
  | { error: string }
  | { success: true }
  | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function solicitudRegistroLocalAction(
  _prev: SolicitudRegistroState,
  formData: FormData,
): Promise<SolicitudRegistroState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const direccion = String(formData.get("direccion") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();

  const fotos = formData
    .getAll("fotos")
    .filter((file): file is File => file instanceof File && file.size > 0);

  if (!nombre) {
    return { error: "El nombre del local es obligatorio" };
  }

  if (!descripcion) {
    return { error: "La descripción es obligatoria" };
  }

  if (!email) {
    return { error: "El correo electrónico es obligatorio" };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Correo electrónico inválido" };
  }

  if (!telefono) {
    return { error: "El teléfono es obligatorio" };
  }

  if (!direccion) {
    return { error: "La dirección es obligatoria" };
  }

  if (fotos.length === 0) {
    return { error: "Debés subir al menos una foto de referencia" };
  }

  try {
    await enviarSolicitudRegistroLocal({
      nombre,
      descripcion,
      email,
      direccion,
      telefono,
      fotos,
    });
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "No se pudo enviar la solicitud. Intentalo nuevamente.",
    };
  }

  return { success: true };
}
