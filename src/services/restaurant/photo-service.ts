import axios from "axios";

import type {
  RestaurantCoverPhotoInput,
  RestaurantReferencePhoto,
} from "@/lib/restaurant/photo/types";
import { clientApi as api } from "@/services/shared/api-client";

type RestaurantReferencePhotoApiResponse = {
  id: number;
  solicitudId: number;
  urlFoto: string;
};

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data;
  return data?.error ?? data?.message ?? fallback;
}

export async function getRestaurantReferencePhotos(
  restaurantId: number,
): Promise<RestaurantReferencePhoto[]> {
  try {
    const response = await api.get<RestaurantReferencePhotoApiResponse[]>(
      `/api/local/${encodeURIComponent(restaurantId)}/fotos-solicitud`,
    );

    return response.data.map((photo) => ({
      id: photo.id,
      requestId: photo.solicitudId,
      url: photo.urlFoto,
    }));
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "No se pudieron cargar las fotos de referencia del local.",
      ),
    );
  }
}

export async function setRestaurantCoverPhoto(
  restaurantId: number,
  input: RestaurantCoverPhotoInput,
): Promise<void> {
  const body = new FormData();

  if (input.file) {
    body.append("foto", input.file);
  } else {
    body.append("idFoto", String(input.photoId));
  }

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
