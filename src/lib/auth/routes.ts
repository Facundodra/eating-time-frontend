import type { UserRole } from "./types";

export const AUTH_COOKIE_NAME = "eating_time_session";

export const roleHomePath: Record<UserRole, string> = {
  admin: "/admin",
  restaurant: "/restaurant",
  client: "/client",
};

export function getRoleHomePath(role: UserRole) {
  return roleHomePath[role];
}
