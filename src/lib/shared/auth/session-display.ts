import type { LoginWebResponse } from "./types";
import { getFirstImageUrl } from "../image-cache";

const roleLabels: Record<LoginWebResponse["tipoUsuario"], string> = {
  ADMIN: "Administrador",
  LOCAL: "Local",
  CLIENTE: "Cliente",
};

export function getSessionDisplayData(session: LoginWebResponse) {
  const fallbackLabel = roleLabels[session.tipoUsuario];
  const name = session.nombre?.trim() || fallbackLabel;
  const email = session.correo?.trim() || session.email?.trim() || fallbackLabel;

  return {
    email,
    imageUrl: getFirstImageUrl(session.urlFoto),
    name,
    profileAlt: `Foto de perfil de ${name}`,
  };
}
