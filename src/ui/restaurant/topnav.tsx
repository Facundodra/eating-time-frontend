"use client";

import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import ThemeToggle from "../shared/theme/theme-toggle";
import { clearSessionCookies, clearStoredSession } from "@/lib/auth/session-store";
import { logout } from "@/services/auth-service";
import RestaurantRating from "../shared/widgets/rating";
import RestaurantStatus from "../shared/widgets/restaurant-status";

const pageHeaders = [
  {
    path: "/restaurant/discounts",
    breadcrumb: "Gestion comercial",
    title: "Descuentos del local",
  },
  {
    path: "/restaurant/schedules",
    breadcrumb: "Disponibilidad del local",
    title: "Horarios y estado de servicio",
  },
  {
    path: "/restaurant/change-password",
    breadcrumb: "Cuenta del local",
    title: "Cambiar contraseña",
  },
  {
    path: "/restaurant/my-data",
    breadcrumb: "Cuenta del local",
    title: "Mis datos",
  },
  {
    path: "/restaurant",
    breadcrumb: "Bienvenido/a al sistema",
    title: "Panel del local",
  },
];

function getPageHeader(pathname: string) {
  return (
    pageHeaders.find((header) => pathname === header.path) ??
    pageHeaders.at(-1)
  );
}

export default function Topnav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pageHeader = getPageHeader(pathname);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      clearStoredSession();
      await clearSessionCookies();
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="restaurant-top-nav mb-5 flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {pageHeader.breadcrumb}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          {pageHeader.title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <RestaurantStatus />
        <RestaurantRating />
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:text-slate-200 dark:hover:border-orange-500/50 dark:hover:text-orange-300"
        >
          <ArrowLeftEndOnRectangleIcon className="h-5 w-5" />
          <span>{isLoggingOut ? "Cerrando..." : "Cerrar sesión"}</span>
        </button>
      </div>
    </div>
  );
}
