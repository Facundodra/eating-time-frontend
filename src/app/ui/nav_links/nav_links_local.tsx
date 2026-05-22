"use client";

import clsx from 'clsx';

// Defino iconos
import { 
  HomeIcon,
  Squares2X2Icon,
  InboxIcon,
  BuildingStorefrontIcon,
  GiftIcon,
  PercentBadgeIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  UserIcon
} from "@heroicons/react/24/outline";

// Importo Link y usePathname para navegación
import Link from "next/link";
import { usePathname } from "next/navigation";

// Mapeo de enlaces
const navLinksOperacion = [
  { name: "Inicio", href: "/", icon: HomeIcon },
  { name: "Mesa de trabajo", href: "/mesa-de-trabajo", icon: Squares2X2Icon },
  { name: "Pedidos", href: "/pedidos", icon: InboxIcon },
  { name: "Platos", href: "/platos", icon: Utensils },
  { name: "Locales", href: "/locales", icon: BuildingStorefrontIcon },
];

const navLinksComercial = [
  { name: "Cupones", href: "/cupones", icon: GiftIcon },
  { name: "Descuentos", href: "/descuentos", icon: PercentBadgeIcon },
  { name: "Clientes", href: "/clientes", icon: UsersIcon },
  { name: "Reclamos", href: "/reclamos", icon: ChatBubbleLeftIcon },
];

const navLinksGestion = [
  { name: "Estadísticas", href: "/estadisticas", icon: ArrowTrendingUpIcon },
  { name: "Horarios", href: "/horarios", icon: ClockIcon },
  { name: "Mis datos", href: "/mis-datos", icon: UserIcon }
];

export default function NavLinksLocal() {
  const pathname = usePathname();
  return (
    <>
      <div className='menu-local'>
        {/* MENU OPERACION */}
        <p className="nav-links-name uppercase text-xs text-gray-400 mb-2">Operación</p>
        <ul className="nav-links local-operacion">
          {navLinksOperacion.map((link) => {
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
        {/* MENU COMERCIAL */}        
        <p className="nav-links-name uppercase text-xs text-gray-400 mb-2">Comercial</p>
        <ul className="nav-links local-comercial">
          {navLinksComercial.map((link) => {
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
        {/* MENU GESTION */}
        <p className="nav-links-name uppercase text-xs text-gray-400 mb-2">Gestión</p>
        <ul className="nav-links local-gestion">
          {navLinksGestion.map((link) => {
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
