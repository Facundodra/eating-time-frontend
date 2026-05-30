import { api } from "./api-client";

type LocalServiceStatusResponse = {
  estadoServicio: boolean;
};

export async function getLocalServiceStatus(localId: string): Promise<boolean> {
  const response = await api.get<LocalServiceStatusResponse>(
    `/api/local/${localId}/estado`,
  );

  return response.data.estadoServicio;
}

export async function updateLocalServiceStatus(
  localId: string,
  enabled: boolean,
): Promise<void> {
  await api.patch(`/api/local/${localId}/estado`, {
    estadoServicio: enabled,
  });
}
