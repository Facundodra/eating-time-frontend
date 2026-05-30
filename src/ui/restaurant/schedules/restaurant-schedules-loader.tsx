"use client";

import { useEffect, useState } from "react";

import { getStoredSession } from "@/lib/auth/session-store";
import type { LocalSchedule } from "@/lib/local-schedule/types";
import { getLocalServiceStatus } from "@/services/local-service-status-service";
import { getLocalSchedule } from "@/services/local-schedule-service";
import ErrorPanel from "@/ui/shared/feedback/error-panel";
import PageLoader from "@/ui/shared/feedback/page-loader";

import RestaurantSchedulesPage from "./restaurant-schedules-page";

export default function RestaurantSchedulesLoader() {
  const [schedule, setSchedule] = useState<LocalSchedule | null>(null);
  const [error, setError] = useState(false);

  async function loadSchedule() {
    const session = getStoredSession();

    if (!session || session.tipoUsuario !== "LOCAL") {
      setError(true);
      return;
    }

    try {
      setError(false);
      const localId = String(session.idTipoUsuario);
      const [localSchedule, serviceEnabled] = await Promise.all([
        getLocalSchedule(localId),
        getLocalServiceStatus(localId),
      ]);

      setSchedule({
        ...localSchedule,
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
