import Link from "next/link";
import {
  BuildingStorefrontIcon,
  LockClosedIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

const actions = [
  {
    title: "Usuarios registrados",
    description:
      "Consultar usuarios del sistema y aplicar filtros por tipo, nombre y estado de bloqueo.",
    href: "/admin/users",
    linkLabel: "Ver usuarios",
    icon: UsersIcon,
  },
  {
    title: "Solicitudes de locales",
    description:
      "Revisar las solicitudes de registro de locales y aprobarlas o rechazarlas.",
    href: "/admin/requests",
    linkLabel: "Ver solicitudes",
    icon: BuildingStorefrontIcon,
  },
  {
    title: "Bloqueo de cuentas",
    description:
      "Bloquear o desbloquear cuentas de usuarios con perfil local o cliente.",
    href: "/admin/blocks",
    linkLabel: "Gestionar cuentas",
    icon: LockClosedIcon,
  },
];

export default function AdminQuickActions() {
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">
        Funciones principales
      </h2>
      <div className="grid gap-4 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <article
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              key={action.title}
            >
              <Icon className="h-6 w-6 text-orange-600" />
              <h3 className="mt-6 text-base font-bold text-slate-950 dark:text-white">
                {action.title}
              </h3>
              <p className="mt-3 min-h-12 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {action.description}
              </p>
              <Link
                className="mt-6 inline-flex text-sm font-bold text-orange-600 transition hover:text-orange-700"
                href={action.href}
              >
                {action.linkLabel}
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
