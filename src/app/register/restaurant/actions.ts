"use server";

import { enviarSolicitudRegistroRestaurant } from "@/services/admin/gestion-service";

export type RestaurantRegisterState =
  | { error: string; success?: never }
  | { success: true; error?: never }
  | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerRestaurantAction(
  _prev: RestaurantRegisterState,
  formData: FormData,
): Promise<RestaurantRegisterState> {
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
    return { error: "La descripcion es obligatoria" };
  }

  if (!email) {
    return { error: "El correo electronico es obligatorio" };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Correo electronico invalido" };
  }

  if (!telefono) {
    return { error: "El telefono es obligatorio" };
  }

  if (!direccion) {
    return { error: "La direccion es obligatoria" };
  }

  if (fotos.length === 0) {
    return { error: "Debes subir al menos una foto de referencia" };
  }

  try {
    await enviarSolicitudRegistroRestaurant({
      nombre,
      descripcion,
      email,
      direccion,
      telefono,
      fotos,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo enviar la solicitud. Intentalo nuevamente.",
    };
  }

  return { success: true };
}
