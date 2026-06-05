"use client";

import { useEffect, useState } from "react";

import type { RestaurantDashboardData } from "@/lib/restaurant/dashboard/types";
import { getStoredSession } from "@/lib/shared/auth/session-store";
import { getRestaurantDashboardData } from "@/services/restaurant/dashboard-service";

import RestaurantQuickActions from "./quick-actions";
import RestaurantRecentOrders from "./recent-orders";
import RestaurantStats from "./stats";

export default function RestaurantDashboard() {
  const [data, setData] = useState<RestaurantDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      const session = getStoredSession();
      const restaurantId = session?.idTipoUsuario
        ? String(session.idTipoUsuario)
        : "";

      if (!restaurantId) {
        setError("No se pudo obtener el ID del local.");
        setIsLoading(false);
        return;
      }

      try {
        const dashboardData = await getRestaurantDashboardData(restaurantId);
        if (ignore) return;
        setData(dashboardData);
        setError(null);
      } catch (err) {
        if (ignore) return;
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el panel del local.",
        );
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      ) : null}

      <RestaurantStats isLoading={isLoading} stats={data?.stats ?? []} />
      <RestaurantQuickActions />
      <RestaurantRecentOrders
        error={data?.ordersError}
        isLoading={isLoading}
        orders={data?.recentOrders ?? []}
      />
    </section>
  );
}
