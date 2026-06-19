"use client";

import {
  ArrowTrendingUpIcon,
  BuildingStorefrontIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  GiftIcon,
  HomeIcon,
  InboxIcon,
  KeyIcon,
  PercentBadgeIcon,
  Squares2X2Icon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const operationsNavLinks = [
  { name: "Inicio", href: "/restaurant", icon: HomeIcon },
  { name: "Mesa de trabajo", href: "/restaurant/workbench", icon: Squares2X2Icon },
  { name: "Reclamos", href: "/restaurant/claims", icon: ChatBubbleLeftIcon },
];

const managementNavLinks = [
  { name: "Platos", href: "/restaurant/dishes", icon: BuildingStorefrontIcon },
  { name: "Cupones", href: "/restaurant/coupons", icon: GiftIcon },
  { name: "Descuentos", href: "/restaurant/discounts", icon: PercentBadgeIcon },
  { name: "Horarios", href: "/restaurant/schedules", icon: ClockIcon },
];

const commercialNavLinks = [
  { name: "Pedidos", href: "/restaurant/orders", icon: InboxIcon },
  { name: "Clientes", href: "/restaurant/customers", icon: UsersIcon },
  { name: "Estadísticas", href: "/restaurant/statistics", icon: ArrowTrendingUpIcon },
];

const accountNavLinks = [
  { name: "Mis datos", href: "/restaurant/my-data", icon: UserIcon },
  { name: "Cambiar contraseña", href: "/restaurant/change-password", icon: KeyIcon },
];

export const restaurantNavGroups = [
  { label: "Operación", className: "restaurant-operations", links: operationsNavLinks },
  { label: "Gestión", className: "restaurant-management", links: managementNavLinks },
  { label: "Comercial", className: "restaurant-commercial", links: commercialNavLinks },
  { label: "Cuenta", className: "restaurant-account", links: accountNavLinks },
];

export default function NavLinksRestaurant() {
  const pathname = usePathname();

  return (
    <div className="restaurant-menu space-y-1">
      {restaurantNavGroups.map((group) => (
        <div key={group.label}>
          <p className="nav-links-name mb-1.5 text-[11px] uppercase text-gray-400 dark:text-slate-500">
            {group.label}
          </p>
          <ul className={clsx("nav-links space-y-0", group.className)}>
            {group.links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <li
                  className={clsx(
                    "nav-link rounded-xl px-3 py-2.5 transition-all duration-300 hover:bg-orange-700/10 group/li dark:hover:bg-orange-500/10",
                    {
                      "bg-orange-700/10 dark:bg-orange-500/10": isActive,
                    },
                  )}
                  key={link.name}
                >
                  <Link className="flex items-center gap-2" href={link.href}>
                    <Icon
                      className={clsx("h-[18px] w-[18px] shrink-0 transition-all duration-300", {
                        "text-orange-700 dark:text-orange-400": isActive,
                        "text-gray-700 group-hover/li:text-orange-700 dark:text-slate-300 dark:group-hover/li:text-orange-300": !isActive,
                      })}
                    />
                    <span
                      className={clsx(
                        "relative top-[1px] overflow-hidden whitespace-nowrap text-sm transition-all duration-300 group-hover/li:text-orange-700 dark:group-hover/li:text-orange-300",
                        {
                          "text-orange-700 dark:text-orange-400": isActive,
                          "text-gray-700 dark:text-slate-200": !isActive,
                        },
                      )}
                    >
                      {link.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
