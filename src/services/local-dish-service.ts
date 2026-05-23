import type { LocalDish, LocalDishesResponse } from "@/lib/local-dish/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

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

function mapPlatoToLocalDish(plato: PlatoDtoFromApi): LocalDish {
  return {
    id: String(plato.id),
    name: plato.nombre,
    price: plato.precio,
    imageUrl: plato.fotoUrl,
    status: plato.disponible ? "available" : "unavailable",
    createdAt: plato.creacion,
  };
}

export async function getLocalDishes(
  localId: string,
): Promise<LocalDishesResponse> {
  const response = await fetch(
    `${API_URL}/api/platos?idLocal=${localId}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`Error al obtener platos (${response.status})`);
  }

  const platos: PlatoDtoFromApi[] = await response.json();

  return {
    localId,
    dishes: platos.map(mapPlatoToLocalDish),
  };
}

export async function createDish(
  localId: string,
  data: { name: string; price: number; image?: File | null },
): Promise<void> {
  const body = new FormData();
  body.append("idLocal", localId);
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
