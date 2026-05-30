import {
  MapPinIcon,
  ShoppingBagIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";

import DishesList from "@/ui/client/dishes/dishes-list";
import RestaurantList from "@/ui/client/restaurants/restaurant-list";

export default function ClientPage() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-8">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-bold text-orange-600 dark:text-orange-300">
            Inicio cliente
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            Elegi un local, encontra un plato y prepara tu pedido.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Desde aca podes explorar locales disponibles, revisar platos y
            administrar tus puntos de entrega.
          </p>
        </div>

        <div className="grid gap-3">
          <QuickLink
            href="/client/platos"
            icon={<ShoppingBagIcon className="h-5 w-5" />}
            label="Ver platos"
            text="Explora el catalogo completo."
          />
          <QuickLink
            href="/client/mi-cuenta/puntos-de-entrega"
            icon={<MapPinIcon className="h-5 w-5" />}
            label="Puntos de entrega"
            text="Gestiona tus direcciones."
          />
        </div>
      </div>

      <section className="space-y-4">
        <SectionHeader
          title="Locales destacados"
          description="Ordena y filtra locales para encontrar opciones abiertas o mejor calificadas."
          href="/client"
          hrefLabel="Actualizar vista"
        />
        <RestaurantList compact />
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Platos para descubrir"
          description="Una seleccion inicial del catalogo disponible en la plataforma."
          href="/client/platos"
          hrefLabel="Ver todos"
        />
        <DishesList compact />
      </section>
    </section>
  );
}

function QuickLink({
  href,
  icon,
  label,
  text,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500/50"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-bold text-slate-950 dark:text-white">
          {label}
        </span>
        <span className="mt-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
          {text}
        </span>
      </span>
    </Link>
  );
}

function SectionHeader({
  description,
  href,
  hrefLabel,
  title,
}: {
  description: string;
  href: string;
  hrefLabel: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2 text-sm font-bold text-orange-600 dark:text-orange-300">
          <StarIcon className="h-4 w-4" />
          <span>{title}</span>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex h-10 w-fit items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-orange-500/50 dark:hover:text-orange-300"
      >
        {hrefLabel}
      </Link>
    </div>
  );
}
