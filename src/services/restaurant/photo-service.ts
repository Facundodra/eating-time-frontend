import axios from "axios";

import type { RestaurantCoverPhotosInput } from "@/lib/restaurant/photo/types";
import { clientApi as api } from "@/services/shared/api-client";

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data;
  return data?.error ?? data?.message ?? fallback;
}

export async function setRestaurantCoverPhotos(
  restaurantId: number,
  input: RestaurantCoverPhotosInput,
): Promise<void> {
  const body = new FormData();

  if (input.mobileFile) {
    body.append(
      "fotoPortadaMobile",
      input.mobileFile,
      input.mobileFile.name,
    );
  }

  if (input.desktopFile) {
    body.append(
      "fotoPortadaDesktop",
      input.desktopFile,
      input.desktopFile.name,
    );
  }

  try {
    await api.patch(
      `/api/local/${encodeURIComponent(restaurantId)}/portadas`,
      body,
    );
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "No se pudieron actualizar las fotos de portada."),
    );
  }
}
