import type { RestaurantDish, RestaurantDishesResponse } from "@/lib/restaurant/dish/types";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface PlatoDtoFromApi {
  id: number;
  nombre: string;
  fotoUrl: string | null;
  precio: number;
  disponible: boolean;
  creacion: string;
  eliminacion: string | null;
  localId: number;
  categoriaIds: number[] | null;
}

function mapPlatoToRestaurantDish(plato: PlatoDtoFromApi): RestaurantDish {
  return {
    id: String(plato.id),
    name: plato.nombre,
    price: plato.precio,
    imageUrl: plato.fotoUrl,
    status: plato.disponible ? "available" : "unavailable",
    createdAt: plato.creacion,
  };
}

export async function getRestaurantDishes(
  restaurantId: string,
): Promise<RestaurantDishesResponse> {
  const response = await fetch(
    `${API_URL}/api/platos?idLocal=${restaurantId}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`Error al obtener platos (${response.status})`);
  }

  const platos: PlatoDtoFromApi[] = await response.json();

  return {
    restaurantId,
    dishes: platos.map(mapPlatoToRestaurantDish),
  };
}

export async function createDish(
  restaurantId: string,
  data: { name: string; price: number; image?: File | null },
): Promise<void> {
  const body = new FormData();
  body.append("idLocal", restaurantId);
  body.append("nombre", data.name);
  body.append("precio", String(data.price));
  if (data.image) body.append("imagen", data.image);

  const response = await fetch(`${API_URL}/api/platos`, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    let errorMessage = `Error al crear plato (${response.status})`;
    try {
      const text = await response.text();
      if (text) errorMessage = text;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }
}

export async function updateDish(
  dishId: string,
  data: { name?: string; price?: number; image?: File | null },
): Promise<void> {
  const body = new FormData();
  if (data.name) body.append("nombre", data.name);
  if (data.price != null) body.append("precio", String(data.price));
  if (data.image) body.append("imagen", data.image);

  const response = await fetch(`${API_URL}/api/platos/${dishId}`, {
    method: "PATCH",
    body,
  });

  if (!response.ok) {
    let errorMessage = `Error al modificar plato (${response.status})`;
    try {
      const text = await response.text();
      if (text) errorMessage = text;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }
}

export async function deleteDish(dishId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/platos/${dishId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    let errorMessage = `Error al eliminar plato (${response.status})`;
    try {
      const text = await response.text();
      if (text) errorMessage = text;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }
}

export async function toggleDishAvailability(dishId: string): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/platos/${dishId}/disponibilidad`,
    { method: "PATCH" },
  );

  if (!response.ok) {
    let errorMessage = `Error al cambiar disponibilidad (${response.status})`;
    try {
      const text = await response.text();
      if (text) errorMessage = text;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }
}
