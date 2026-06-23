import axios from "axios";

import type { RestaurantCoverPhotoInput } from "@/lib/restaurant/photo/types";
import { clientApi as api } from "@/services/shared/api-client";

type RestaurantLocalApiResponse = {
  urlPortada?: string | null;
  urlFotoPortada?: string | null;
  fotoPortadaUrl?: string | null;
  coverPhotoUrl?: string | null;
};

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data;
  return data?.error ?? data?.message ?? fallback;
}

function getFirstStringValue(...values: Array<string | null | undefined>) {
  return (
    values
      .find((value) => typeof value === "string" && value.trim())
      ?.trim() ?? ""
  );
}

export async function getRestaurantCoverPhotoUrl(
  restaurantId: number,
): Promise<string> {
  try {
    const response = await api.get<RestaurantLocalApiResponse>(
      `/api/local/${encodeURIComponent(restaurantId)}`,
    );

    return getFirstStringValue(
      response.data.urlPortada,
      response.data.urlFotoPortada,
      response.data.fotoPortadaUrl,
      response.data.coverPhotoUrl,
    );
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "No se pudo cargar la foto de portada."),
    );
  }
}

export async function setRestaurantCoverPhoto(
  restaurantId: number,
  input: RestaurantCoverPhotoInput,
): Promise<void> {
  const body = new FormData();
  body.append("foto", input.file, input.file.name);

  try {
    await api.post(
      `/api/local/${encodeURIComponent(restaurantId)}/foto-portada`,
      body,
    );
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "No se pudo actualizar la foto de portada."),
    );
  }
}
