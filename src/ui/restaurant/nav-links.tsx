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

const navGroups = [
  { label: "Operación", className: "restaurant-operations", links: operationsNavLinks },
  { label: "Gestión", className: "restaurant-management", links: managementNavLinks },
  { label: "Comercial", className: "restaurant-commercial", links: commercialNavLinks },
  { label: "Cuenta", className: "restaurant-account", links: accountNavLinks },
];

export default function NavLinksRestaurant() {
  const pathname = usePathname();

  return (
    <div className="restaurant-menu">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="nav-links-name mb-2 text-xs uppercase text-gray-400">
            {group.label}
          </p>
          <ul className={clsx("nav-links", group.className)}>
            {group.links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <li
                  className={clsx(
                    "nav-link mb-3 rounded-xl px-3 py-3 transition-all duration-300 hover:bg-orange-700/10 group/li",
                    {
                      "bg-orange-700/10": isActive,
                    },
                  )}
                  key={link.name}
                >
                  <Link className="flex items-center gap-2" href={link.href}>
                    <Icon
                      className={clsx("h-5 w-5 shrink-0", {
                        "text-orange-700": isActive,
                        "text-gray-700 dark:text-slate-300": !isActive,
                      })}
                    />
                    <span
                      className={clsx(
                        "relative top-[1px] overflow-hidden whitespace-nowrap text-sm transition-all duration-300 group-hover/li:text-orange-700",
                        {
                          "text-orange-700": isActive,
                          "text-gray-700 dark:text-slate-300": !isActive,
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
