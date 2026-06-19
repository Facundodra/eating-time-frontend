"use client";

import { useCallback } from "react";

import { useAsyncData } from "@/hooks/shared/use-async-data";
import { getRestaurantDashboardData } from "@/services/restaurant/dashboard-service";
import { getCurrentSession } from "@/services/shared/auth-service";

import RestaurantCoverPhotoSection from "./cover-photo-section";
import RestaurantQuickActions from "./quick-actions";
import RestaurantRecentOrders from "./recent-orders";
import RestaurantStats from "./stats";

export default function RestaurantDashboard() {
  const loadDashboard = useCallback(async () => {
    const session = await getCurrentSession();
    const restaurantId = session?.idTipoUsuario
      ? String(session.idTipoUsuario)
      : "";

    if (!restaurantId) {
      throw new Error("No se pudo obtener el ID del local.");
    }

    return getRestaurantDashboardData(restaurantId);
  }, []);

  const { data, error, isLoading } = useAsyncData(loadDashboard);
  const errorMessage =
    error?.message ?? "No se pudo cargar el panel del local.";

  return (
    <section className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {errorMessage}
        </div>
      ) : null}

      <RestaurantCoverPhotoSection />
      <RestaurantStats
        error={data?.statsError}
        isLoading={isLoading}
        stats={data?.stats ?? []}
      />
      <RestaurantQuickActions />
      <RestaurantRecentOrders
        error={data?.ordersError}
        isLoading={isLoading}
        orders={data?.recentOrders ?? []}
      />
    </section>
  );
}
