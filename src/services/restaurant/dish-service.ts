import type {
  DishCategory,
  RestaurantDish,
  RestaurantDishesResponse,
} from "@/lib/restaurant/dish/types";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

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

export async function getDishCategories(): Promise<DishCategory[]> {
  const response = await fetch(`${API_URL}/api/categorias`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Error al obtener categorías (${response.status})`);
  }

  const categorias: CategoriaDtoFromApi[] = await response.json();

  return categorias.map((categoria) => ({
    id: String(categoria.id),
    name: categoria.nombre,
  }));
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
