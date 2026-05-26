"use server";

import { revalidatePath } from "next/cache";

import {
  createDish,
  deleteDish,
  toggleDishAvailability,
  updateDish,
} from "@/services/local-dish-service";

export async function createDishAction(
  localId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const image = formData.get("image") as File | null;

  if (!name || price <= 0) {
    return { error: "Nombre y precio son obligatorios" };
  }

  try {
    await createDish(localId, {
      name,
      price,
      image: image && image.size > 0 ? image : null,
    });
    revalidatePath("/restaurant/dishes");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al crear plato" };
  }
}

export async function updateDishAction(
  dishId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const name = String(formData.get("name") ?? "").trim() || undefined;
  const priceRaw = formData.get("price");
  const price = priceRaw ? Number(priceRaw) : undefined;
  const image = formData.get("image") as File | null;

  try {
    await updateDish(dishId, {
      name,
      price,
      image: image && image.size > 0 ? image : null,
    });
    revalidatePath("/restaurant/dishes");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al modificar plato" };
  }
}

export async function deleteDishAction(
  dishId: string,
): Promise<{ error?: string }> {
  try {
    await deleteDish(dishId);
    revalidatePath("/restaurant/dishes");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al eliminar plato" };
  }
}

export async function toggleDishAvailabilityAction(
  dishId: string,
): Promise<{ error?: string }> {
  try {
    await toggleDishAvailability(dishId);
    revalidatePath("/restaurant/dishes");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al cambiar disponibilidad" };
  }
}
