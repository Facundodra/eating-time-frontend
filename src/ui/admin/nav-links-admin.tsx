"use client";

import {
  BuildingStorefrontIcon,
  HomeIcon,
  KeyIcon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mainNavLinks = [
  { name: "Inicio", href: "/admin", icon: HomeIcon },
  { name: "Usuarios", href: "/admin/usuarios", icon: UsersIcon },
  {
    name: "Solicitudes de locales",
    href: "/admin/requests",
    icon: BuildingStorefrontIcon,
  },
];

const accountNavLinks = [
  { name: "Mis datos", href: "/admin/my-data", icon: UserIcon },
  { name: "Cambiar contraseña", href: "/admin/change-password", icon: KeyIcon },
];

export const adminNavGroups = [
  { label: "Principal", className: "admin-main", links: mainNavLinks },
  { label: "Cuenta", className: "admin-account", links: accountNavLinks },
];

export default function NavLinksAdmin() {
  const pathname = usePathname();

  return (
    <div className="admin-menu space-y-1">
      {adminNavGroups.map((group) => (
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
                      className={clsx(
                        "h-[18px] w-[18px] shrink-0 transition-all duration-300",
                        {
                          "text-orange-700 dark:text-orange-400": isActive,
                          "text-gray-700 group-hover/li:text-orange-700 dark:text-slate-300 dark:group-hover/li:text-orange-300": !isActive,
                        },
                      )}
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
