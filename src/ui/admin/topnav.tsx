"use client";

import { usePathname } from "next/navigation";

import ThemeToggle from "../shared/theme/theme-toggle";

const pageHeaders = [
  {
    path: "/admin/requests",
    breadcrumb: "Administracion / Solicitudes",
    title: "Solicitudes de locales",
  },
  {
    path: "/admin/change-password",
    breadcrumb: "Administracion / Cuenta",
    title: "Cambiar contrasena",
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
    pageHeaders[pageHeaders.length - 1]
  );
}

export default function Topnav() {
  const pathname = usePathname();
  const pageHeader = getPageHeader(pathname);

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
      </div>
    </div>
  );
}
