"use client";

import { usePathname } from "next/navigation";

import ThemeToggle from "../shared/theme/theme-toggle";
import RestaurantRating from "../shared/widgets/rating";
import RestaurantStatus from "../shared/widgets/restaurant-status";

const pageHeaders = [
  {
    path: "/restaurant/workbench",
    breadcrumb: "Operacion del local",
    title: "Mesa de trabajo",
  },
  {
    path: "/restaurant/orders",
    breadcrumb: "Operacion del local",
    title: "Pedidos",
  },
  {
    path: "/restaurant/dishes",
    breadcrumb: "Gestion del menu",
    title: "Platos del local",
  },
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
    title: "Cambiar contrasena",
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
    pageHeaders.find((header) => pathname.startsWith(header.path)) ??
    pageHeaders[pageHeaders.length - 1]
  );
}

export default function Topnav() {
  const pathname = usePathname();
  const pageHeader = getPageHeader(pathname);

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
      </div>
    </div>
  );
}
