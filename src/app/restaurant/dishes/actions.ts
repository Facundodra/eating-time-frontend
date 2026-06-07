"use server";

import { revalidatePath } from "next/cache";

import {
  createDish,
  deleteDish,
  toggleDishAvailability,
  updateDish,
} from "@/services/restaurant/dish-service";

function parseCategoryIds(formData: FormData): string[] {
  return formData
    .getAll("categoryIds")
    .map((value) => String(value).trim())
    .filter(Boolean);
}

export async function createDishAction(
  restaurantId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const categoryIds = parseCategoryIds(formData);
  const image = formData.get("image") as File | null;

  if (!name || price <= 0) {
    return { error: "Nombre y precio son obligatorios" };
  }

  if (!description) {
    return { error: "La descripción es obligatoria" };
  }

  if (categoryIds.length === 0) {
    return { error: "Debe seleccionar al menos una categoría" };
  }

  try {
    await createDish(restaurantId, {
      name,
      description,
      price,
      categoryIds,
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
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = formData.get("price");
  const price = priceRaw ? Number(priceRaw) : undefined;
  const categoryIds = parseCategoryIds(formData);
  const image = formData.get("image") as File | null;

  if (!description) {
    return { error: "La descripción es obligatoria" };
  }

  if (categoryIds.length === 0) {
    return { error: "Debe seleccionar al menos una categoría" };
  }

  try {
    await updateDish(dishId, {
      name,
      description,
      price,
      categoryIds,
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
