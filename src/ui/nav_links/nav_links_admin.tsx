"use client";

import clsx from 'clsx';

// Defino iconos
import { 
  UserIcon,
  KeyIcon,
  HomeIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";

// Importo Link y usePathname para navegación
import Link from "next/link";
import { usePathname } from "next/navigation";

// Mapeo de enlaces
const navLinksPrincipal = [
  { name: "Inicio", href: "/", icon: HomeIcon },
  { name: "Usuarios", href: "/usuarios", icon: UsersIcon },
  { name: "Solicitudes de locales", href: "/solicitudes", icon: BuildingStorefrontIcon },
  { name: "Bloqueos", href: "/bloqueos", icon: LockClosedIcon },
];
const navLinksCuenta = [
  { name: "Mis datos", href: "/mis-datos", icon: UserIcon },
  { name: "Cambiar contraseña", href: "/cambiar-contrasena", icon: KeyIcon },
];

export default function NavLinksAdmin() {
  const pathname = usePathname();
  return (
    <>
      <div className='admin-menu'>
        {/* Menu princial */}
        <p className="nav-links-name uppercase text-xs text-gray-400 mb-2">Principal</p>
        <ul className="nav-links admin-principal">
          {navLinksPrincipal.map((link) => {
            // Itero en los enlaces y los renderizo
            const Icon = link.icon;
            return (
              <li className={clsx("nav-link mb-3 px-3 py-3 rounded-xl transition-all duration-400 hover:bg-orange-700/10 group/li", {
                "bg-orange-700/10": pathname === link.href,
              })} key={link.name}>
                <Link className="flex items-center gap-2" href={link.href}>
                  {/* Si es el enlace de la pagina actual se pinta de naranja texto icono y fondo */}
                  <Icon className={clsx("w-5", {"text-orange-700": pathname === link.href, "text-gray-700": pathname !== link.href})} />
                  <span className={clsx("text-sm relative top-[1px] transition-all duration-400 group-hover/li:text-orange-700", {"text-orange-700": pathname === link.href, "text-gray-700": pathname !== link.href})}>{link.name}</span>
                  </Link>
              </li>
            );
          })}
        </ul>
        {/* Menu cuenta */}
        <p className="nav-links-name uppercase text-xs text-gray-400 mb-2">Cuenta</p>
        <ul className="nav-links admin-cuenta">
          {navLinksCuenta.map((link) => {
            // Itero en los enlaces y los renderizo
            const Icon = link.icon;
            return (
              <li className={clsx("nav-link mb-3 px-3 py-3 rounded-xl transition-all duration-400 hover:bg-orange-700/10 group/li", {
                "bg-orange-700/10": pathname === link.href,
              })} key={link.name}>
                <Link className="flex items-center gap-2" href={link.href}>
                  {/* Si es el enlace de la pagina actual se pinta de naranja texto icono y fondo */}
                  <Icon className={clsx("w-5", {"text-orange-700": pathname === link.href, "text-gray-700": pathname !== link.href})} />
                  <span className={clsx("text-sm relative top-[1px] transition-all duration-400 group-hover/li:text-orange-700", {"text-orange-700": pathname === link.href, "text-gray-700": pathname !== link.href})}>{link.name}</span>
                  </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
