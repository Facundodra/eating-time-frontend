"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import { getStoredSession } from "@/lib/shared/auth/session-store";
import {
  getRestaurantAvailability,
  RESTAURANT_AVAILABILITY_REFRESH_EVENT,
} from "@/services/restaurant/availability-service";

export default function RestaurantStatus({ className }: { className?: string }) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const refreshAvailability = useCallback(async () => {
    const session = getStoredSession();
    const restaurantId = session?.idTipoUsuario ? String(session.idTipoUsuario) : "";

    if (!restaurantId) {
      setIsAvailable(null);
      return;
    }

    try {
      const availability = await getRestaurantAvailability(restaurantId);
      setIsAvailable(availability);
    } catch {
      setIsAvailable(null);
    }
  }, []);

  useEffect(() => {
    const initialTimeoutId = window.setTimeout(() => {
      void refreshAvailability();
    }, 0);

    const intervalId = window.setInterval(() => {
      void refreshAvailability();
    }, 60000);

    function handleFocus() {
      void refreshAvailability();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshAvailability();
      }
    }

    window.addEventListener("focus", handleFocus);
    window.addEventListener(
      RESTAURANT_AVAILABILITY_REFRESH_EVENT,
      handleFocus,
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(initialTimeoutId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(
        RESTAURANT_AVAILABILITY_REFRESH_EVENT,
        handleFocus,
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshAvailability]);

  const statusClass = isAvailable ? "open bg-green-100" : "closed bg-red-100";
  const label = isAvailable == null ? "Sin datos" : isAvailable ? "Abierto" : "Cerrado";

  return (
    <div
      className={clsx(
        "restaurant-status inline-block flex items-center rounded-3xl px-4 py-3 leading-1",
        statusClass,
        className,
      )}
    >
      <span className="text-xs font-bold leading-1 [.open_&]:text-green-600 [.closed_&]:text-red-500 before:relative before:bottom-[1px] before:mr-1 before:inline-block before:h-[6px] before:w-[6px] before:rounded-full before:content-[''] [.closed_&]:before:bg-red-500 [.open_&]:before:bg-green-600">
        {label}
      </span>
    </div>
  );
}
