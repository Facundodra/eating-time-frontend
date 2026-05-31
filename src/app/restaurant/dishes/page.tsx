"use client";

import { useEffect, useState } from "react";

import { getStoredSession } from "@/lib/shared/auth/session-store";
import { getRestaurantDishes } from "@/services/restaurant/dish-service";
import type { RestaurantDishesResponse } from "@/lib/restaurant/dish/types";
import RestaurantDishesPage from "@/ui/restaurant/dishes/dishes-page";

export default function DishesPage() {
  const [initialData, setInitialData] = useState<RestaurantDishesResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDishes() {
      const session = getStoredSession();
      const restaurantId = session?.idTipoUsuario
        ? String(session.idTipoUsuario)
        : "";

      if (!restaurantId) {
        setError("No se pudo obtener el ID del local. Intenta iniciar sesion nuevamente.");
        return;
      }

      try {
        const data = await getRestaurantDishes(restaurantId);
        setInitialData(data);
      } catch {
        setInitialData({ restaurantId, dishes: [] });
      }
    }

    loadDishes();
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!initialData) {
    return (
      <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
        Cargando platos...
      </p>
    );
  }

  return <RestaurantDishesPage initialData={initialData} />;
}
