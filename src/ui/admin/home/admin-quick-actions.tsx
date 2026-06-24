"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BuildingStorefrontIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

const actions = [
  {
    title: "Usuarios registrados",
    description:
      "Consultar usuarios del sistema y aplicar filtros por tipo, nombre y estado de bloqueo.",
    href: "/admin/usuarios",
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
];

export default function AdminQuickActions() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasHiddenLeftActions, setHasHiddenLeftActions] = useState(false);
  const [hasHiddenRightActions, setHasHiddenRightActions] = useState(false);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer) {
      return;
    }

    const container = scrollContainer;

    function updateScrollMask() {
      const maxScrollLeft = container.scrollWidth - container.clientWidth;

      setHasHiddenLeftActions(container.scrollLeft > 1);
      setHasHiddenRightActions(container.scrollLeft < maxScrollLeft - 1);
    }

    updateScrollMask();
    container.addEventListener("scroll", updateScrollMask, {
      passive: true,
    });
    window.addEventListener("resize", updateScrollMask);

    return () => {
      container.removeEventListener("scroll", updateScrollMask);
      window.removeEventListener("resize", updateScrollMask);
    };
  }, []);

  const scrollMaskClass = hasHiddenLeftActions
    ? hasHiddenRightActions
      ? "[mask-image:linear-gradient(to_right,transparent,black_18px,black_calc(100%-18px),transparent)]"
      : "[mask-image:linear-gradient(to_right,transparent,black_18px)]"
    : hasHiddenRightActions
      ? "[mask-image:linear-gradient(to_right,black_calc(100%-18px),transparent)]"
      : "[mask-image:none]";

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">
          Accesos principales
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Opciones priorizadas según las tareas más frecuentes del administrador.
        </p>
      </div>

      <div
        ref={scrollContainerRef}
        className={clsx(
          "hide-scrollbar grid auto-cols-[minmax(230px,76vw)] grid-flow-col gap-3 overflow-x-auto pb-1 sm:auto-cols-[minmax(260px,42vw)] sm:gap-4 lg:grid-flow-row lg:grid-cols-2 lg:auto-cols-auto lg:overflow-visible lg:pb-0 lg:[mask-image:none]",
          scrollMaskClass,
        )}
      >
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <article
              className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 dark:border-slate-800 dark:bg-slate-900"
              key={action.title}
            >
              <Icon className="h-5 w-5 text-orange-600" />
              <h3 className="mt-3 text-sm font-bold text-slate-950 sm:mt-4 sm:text-base dark:text-white">
                {action.title}
              </h3>
              <p className="mt-2 min-h-10 text-xs leading-5 text-slate-500 sm:text-sm dark:text-slate-400">
                {action.description}
              </p>
              <Link
                className="mt-3 inline-flex text-xs font-bold text-orange-600 transition hover:text-orange-700 sm:mt-4 sm:text-sm"
                href={action.href}
              >
                {action.linkLabel}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
