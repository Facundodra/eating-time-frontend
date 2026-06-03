"use client";

import { useEffect, useState } from "react";

import { getCurrentSession } from "@/services/shared/auth-service";
import type { RestaurantSchedule } from "@/lib/restaurant/schedule/types";
import { getRestaurantServiceStatus } from "@/services/restaurant/service-status-service";
import { getRestaurantSchedule } from "@/services/restaurant/schedule-service";
import ErrorPanel from "@/ui/shared/feedback/error-panel";
import PageLoader from "@/ui/shared/feedback/page-loader";

import RestaurantSchedulesPage from "./schedules-page";

export default function RestaurantSchedulesLoader() {
  const [schedule, setSchedule] = useState<RestaurantSchedule | null>(null);
  const [error, setError] = useState(false);

  async function loadSchedule() {
    const session = await getCurrentSession();

    if (!session) {
      setError(true);
      return;
    }

    try {
      setError(false);
      const restaurantId = String(session.idTipoUsuario);
      const [restaurantSchedule, serviceEnabled] = await Promise.all([
        getRestaurantSchedule(restaurantId),
        getRestaurantServiceStatus(restaurantId),
      ]);

      setSchedule({
        ...restaurantSchedule,
        paused: !serviceEnabled,
      });
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSchedule();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (error) {
    return <ErrorPanel onReset={() => window.location.reload()} />;
  }

  if (!schedule) {
    return <PageLoader />;
  }

  return (
    <RestaurantSchedulesPage
      initialSchedule={schedule}
      onReloadSchedule={loadSchedule}
    />
  );
}
