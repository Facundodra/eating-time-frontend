import axios from "axios";

import type {
  DishCategory,
  RestaurantDish,
  RestaurantDishesResponse,
} from "@/lib/restaurant/dish/types";
import { clientApi as api } from "@/services/shared/api-client";

type DishErrorResponse = {
  error?: string;
  message?: string;
  detail?: string;
};

interface PlatoDtoFromApi {
  id: number;
  nombre: string;
  descripcion: string | null;
  fotoUrl: string | null;
  precio: number;
  disponible: boolean;
  creacion: string;
  eliminacion: string | null;
  localId: number;
  categoriaIds: number[] | null;
}

interface CategoriaDtoFromApi {
  id: number;
  nombre: string;
}

function mapPlatoToRestaurantDish(plato: PlatoDtoFromApi): RestaurantDish {
  return {
    id: String(plato.id),
    name: plato.nombre,
    description: plato.descripcion ?? "",
    price: plato.precio,
    imageUrl: plato.fotoUrl,
    status: plato.disponible ? "available" : "unavailable",
    createdAt: plato.creacion,
    categoryIds: (plato.categoriaIds ?? []).map(String),
  };
}

function getDishErrorMessage(error: unknown, fallbackMessage: string) {
  if (!axios.isAxiosError<DishErrorResponse>(error)) {
    return fallbackMessage;
  }

  const data = error.response?.data;
  return data?.error ?? data?.message ?? data?.detail ?? fallbackMessage;
}

export async function getDishCategories(): Promise<DishCategory[]> {
  try {
    const response = await api.get<CategoriaDtoFromApi[]>("/api/categorias");

    return response.data.map((categoria) => ({
      id: String(categoria.id),
      name: categoria.nombre,
    }));
  } catch (error) {
    throw new Error(getDishErrorMessage(error, "Error al obtener categorias"));
  }
}

export async function getRestaurantDishes(
  restaurantId: string,
): Promise<RestaurantDishesResponse> {
  try {
    const response = await api.get<PlatoDtoFromApi[]>("/api/platos", {
      params: { idLocal: restaurantId },
    });

    return {
      restaurantId,
      dishes: response.data.map(mapPlatoToRestaurantDish),
    };
  } catch (error) {
    throw new Error(getDishErrorMessage(error, "Error al obtener platos"));
  }
}

export async function createDish(
  restaurantId: string,
  data: {
    name: string;
    description: string;
    price: number;
    categoryIds: string[];
    image?: File | null;
  },
): Promise<void> {
  const body = new FormData();
  body.append("idLocal", restaurantId);
  body.append("nombre", data.name);
  body.append("descripcion", data.description);
  body.append("precio", String(data.price));
  data.categoryIds.forEach((categoryId) => {
    body.append("categoriaIds", categoryId);
  });
  if (data.image) body.append("imagen", data.image);

  try {
    await api.post("/api/platos", body);
  } catch (error) {
    throw new Error(getDishErrorMessage(error, "Error al crear plato"));
  }
}

export async function updateDish(
  dishId: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    categoryIds?: string[];
    image?: File | null;
  },
): Promise<void> {
  const body = new FormData();
  if (data.name) body.append("nombre", data.name);
  if (data.description != null) body.append("descripcion", data.description);
  if (data.price != null) body.append("precio", String(data.price));
  data.categoryIds?.forEach((categoryId) => {
    body.append("categoriaIds", categoryId);
  });
  if (data.image) body.append("imagen", data.image);

  try {
    await api.patch(`/api/platos/${dishId}`, body);
  } catch (error) {
    throw new Error(getDishErrorMessage(error, "Error al modificar plato"));
  }
}

export async function deleteDish(dishId: string): Promise<void> {
  try {
    await api.delete(`/api/platos/${dishId}`);
  } catch (error) {
    throw new Error(getDishErrorMessage(error, "Error al eliminar plato"));
  }
}

export async function toggleDishAvailability(dishId: string): Promise<void> {
  try {
    await api.patch(`/api/platos/${dishId}/disponibilidad`);
  } catch (error) {
    throw new Error(
      getDishErrorMessage(error, "Error al cambiar disponibilidad"),
    );
  }
}
