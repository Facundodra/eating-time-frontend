import Link from "next/link";
import {
  ClockIcon,
  HandThumbUpIcon,
  LockClosedIcon,
  MapPinIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

import DeleteAccountSection from "./delete-account-section";

const accountLinks = [
  {
    href: "/client/mi-cuenta/puntos-de-entrega",
    title: "Puntos de entrega",
    description: "Gestioná las direcciones para recibir tus pedidos.",
    icon: MapPinIcon,
  },
  {
    href: "/client/order-ratings",
    title: "Calificación de pedidos",
    description: "Califica tus pedidos finalizados.",
    icon: HandThumbUpIcon,
  },
  {
    href: "/client/order-history",
    title: "Historial de pedidos",
    description: "Consultá tus pedidos anteriores y su estado.",
    icon: ClockIcon,
  },
  {
    href: "/client/mi-cuenta/change-password",
    title: "Cambiar contraseña",
    description: "Actualizá tu contraseña de acceso.",
    icon: LockClosedIcon,
  },
  {
    href: "/client/mi-cuenta/edit-user",
    title: "Editar perfil",
    description: "Actualizá tus datos personales.",
    icon: UserCircleIcon,
  },
];

export default function AccountPage() {
  return (
    <>
      <section className="titulo-seccion w-full">
        <span className="ruta text-xs text-gray-400 dark:text-slate-500">
          <Link href="/client">Inicio</Link> / Mi cuenta
        </span>
        <h1 className="titulo mt-2 text-3xl font-bold text-gray-900 dark:text-white">
          Mi cuenta
        </h1>
        <p className="descripcion mt-1 text-sm text-gray-500 dark:text-slate-400">
          Configuración de tu perfil y opciones de la cuenta.
        </p>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white shadow-lg dark:bg-slate-900">
          <div className="border-b border-gray-100 px-5 py-5 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                <UserCircleIcon className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Configuración
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Accesos rápidos a las secciones de tu cuenta.
                </p>
              </div>
            </div>
          </div>

          <ul className="divide-y divide-gray-100 dark:divide-slate-800">
            {accountLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-start gap-4 px-5 py-4 transition hover:bg-orange-50/60 dark:hover:bg-orange-500/5"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                    <link.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-gray-900 dark:text-white">
                      {link.title}
                    </span>
                    <span className="mt-1 block text-sm text-gray-500 dark:text-slate-400">
                      {link.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <DeleteAccountSection />
      </section>
    </>
  );
}
