"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BuildingStorefrontIcon,
  HomeIcon,
  KeyIcon,
  LockClosedIcon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

const mainNavLinks = [
  { name: "Inicio", href: "/admin", icon: HomeIcon },
  { name: "Usuarios", href: "/admin/users", icon: UsersIcon },
  {
    name: "Solicitudes de locales",
    href: "/admin/requests",
    icon: BuildingStorefrontIcon,
  },
  { name: "Bloqueos", href: "/admin/blocks", icon: LockClosedIcon },
];

const accountNavLinks = [
  { name: "Mis datos", href: "/admin/my-data", icon: UserIcon },
  { name: "Cambiar contraseña", href: "/admin/change-password", icon: KeyIcon },
];

export default function NavLinksAdmin() {
  const pathname = usePathname();

  return (
    <div className="admin-menu">
      <p className="nav-links-name mb-2 text-xs uppercase text-gray-400">
        Principal
      </p>
      <ul className="nav-links admin-main">
        {mainNavLinks.map((link) => {
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
                    "relative top-[1px] whitespace-nowrap text-sm transition-all duration-300 group-hover/li:text-orange-700",
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

      <p className="nav-links-name mb-2 text-xs uppercase text-gray-400">
        Cuenta
      </p>
      <ul className="nav-links admin-account">
        {accountNavLinks.map((link) => {
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
                    "relative top-[1px] whitespace-nowrap text-sm transition-all duration-300 group-hover/li:text-orange-700",
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
  );
}
