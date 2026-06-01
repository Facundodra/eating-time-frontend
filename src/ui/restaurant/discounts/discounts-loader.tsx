"use client";

import { useEffect, useState } from "react";

import type { RestaurantDiscountsResponse } from "@/lib/restaurant/discount/types";
import { getStoredSession } from "@/lib/shared/auth/session-store";
import { getRestaurantDiscounts } from "@/services/restaurant/discount-service";

import RestaurantDiscountsPage from "./discounts-page";

export default function RestaurantDiscountsLoader() {
  const [data, setData] = useState<RestaurantDiscountsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadDiscounts() {
      const session = getStoredSession();
      const restaurantId = session?.idTipoUsuario
        ? String(session.idTipoUsuario)
        : "";

      if (!restaurantId) {
        if (!ignore) setError("No se pudo obtener el ID del local.");
        return;
      }

      try {
        const discounts = await getRestaurantDiscounts(restaurantId);

        if (ignore) return;
        setData(discounts);
        setError(null);
      } catch (err) {
        if (ignore) return;
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los descuentos.",
        );
      }
    }

    void loadDiscounts();

    return () => {
      ignore = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm font-medium text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        Cargando descuentos...
      </div>
    );
  }

  return <RestaurantDiscountsPage initialData={data} />;
}
