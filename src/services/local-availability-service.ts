import { api } from "./api-client";

export const LOCAL_AVAILABILITY_REFRESH_EVENT =
  "local-availability:refresh";

type LocalAvailabilityResponse = {
  disponible: boolean;
};

export async function getLocalAvailability(localId: string): Promise<boolean> {
  const response = await api.get<LocalAvailabilityResponse>(
    `/api/local/${localId}/disponibilidad`,
  );

  return response.data.disponible;
}

export function notifyLocalAvailabilityRefresh() {
  window.dispatchEvent(new Event(LOCAL_AVAILABILITY_REFRESH_EVENT));
}
