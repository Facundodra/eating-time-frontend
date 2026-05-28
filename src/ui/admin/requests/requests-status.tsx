import type { RequestStatus } from "./requests-data";

export const requestStatusLabels: Record<RequestStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

export const requestStatusStyles: Record<RequestStatus, string> = {
  pending: "bg-orange-500/10 text-orange-500 dark:text-orange-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export function getRequestStatusLabel(status: RequestStatus) {
  return requestStatusLabels[status];
}

export function getRequestStatusStyle(status: RequestStatus) {
  return requestStatusStyles[status];
}
