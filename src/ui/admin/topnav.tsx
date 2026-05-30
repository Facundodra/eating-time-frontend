"use client";

import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import ThemeToggle from "../shared/theme/theme-toggle";
import { clearSessionCookies, clearStoredSession } from "@/lib/auth/session-store";
import { logout } from "@/services/auth-service";

const pageHeaders = [
  {
    path: "/admin/requests",
    breadcrumb: "Administracion / Solicitudes",
    title: "Solicitudes de locales",
  },
  {
    path: "/admin/change-password",
    breadcrumb: "Administracion / Cuenta",
    title: "Cambiar contraseña",
  },
  {
    path: "/admin/my-data",
    breadcrumb: "Administracion / Cuenta",
    title: "Mis datos",
  },
  {
    path: "/admin",
    breadcrumb: "Administracion / Inicio",
    title: "Panel de administracion",
  },
];

function getPageHeader(pathname: string) {
  return (
    pageHeaders.find((header) => pathname.startsWith(header.path)) ??
    pageHeaders[1]
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
    <div className="admin-top-nav mb-4 flex items-center justify-between gap-4 py-1">
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
