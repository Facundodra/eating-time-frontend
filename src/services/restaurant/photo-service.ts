import axios from "axios";

import type { RestaurantCoverPhotosInput } from "@/lib/restaurant/photo/types";
import { clientApi as api } from "@/services/shared/api-client";

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data;
  if (typeof data === "string") return data;

  return data?.error ?? data?.message ?? fallback;
}

async function patchRestaurantCoverPhoto(
  restaurantId: number,
  field: "fotoPortadaDesktop" | "fotoPortadaMobile",
  file: File,
): Promise<void> {
  const body = new FormData();
  body.append(field, file, file.name);

  await api.patch(
    `/api/local/${encodeURIComponent(restaurantId)}/portadas`,
    body,
  );
}

export async function setRestaurantCoverPhotos(
  restaurantId: number,
  input: RestaurantCoverPhotosInput,
): Promise<void> {
  const uploads: Array<() => Promise<void>> = [];

  if (input.mobileFile) {
    const mobileFile = input.mobileFile;

    uploads.push(
      () => patchRestaurantCoverPhoto(
        restaurantId,
        "fotoPortadaMobile",
        mobileFile,
      ),
    );
  }

  if (input.desktopFile) {
    const desktopFile = input.desktopFile;

    uploads.push(
      () => patchRestaurantCoverPhoto(
        restaurantId,
        "fotoPortadaDesktop",
        desktopFile,
      ),
    );
  }

  try {
    for (const upload of uploads) {
      await upload();
    }
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "No se pudieron actualizar las fotos de portada."),
    );
  }
}
