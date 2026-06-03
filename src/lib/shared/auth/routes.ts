import type { BackendUserRole } from "./types";

// Mapea el rol que devuelve el backend a la raiz del modulo que puede usar.
// Los layouts protegidos usan esto para sacar al usuario de una zona incorrecta.
const backendRoleHomePath: Record<BackendUserRole, string> = {
  ADMIN: "/admin",
  LOCAL: "/restaurant",
  CLIENTE: "/client",
};

export function getBackendRoleHomePath(role: BackendUserRole) {
  return backendRoleHomePath[role];
}
