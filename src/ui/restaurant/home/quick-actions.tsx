"use client";

import {
  ArrowTrendingUpIcon,
  InboxIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  GiftIcon,
  PercentBadgeIcon,
  Squares2X2Icon,
  BuildingStorefrontIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const actions = [
  {
    title: "Mesa de trabajo",
    description:
      "Gestionar los pedidos activos del día y avanzar cada etapa de la operación.",
    href: "/restaurant/workbench",
    linkLabel: "Abrir mesa",
    icon: Squares2X2Icon,
  },
  {
    title: "Reclamos",
    description:
      "Revisar casos pendientes, consultar el pedido asociado y registrar una resolución.",
    href: "/restaurant/claims",
    linkLabel: "Atender reclamos",
    icon: ChatBubbleLeftIcon,
  },
  {
    title: "Platos",
    description:
      "Crear, editar y controlar la disponibilidad de los platos ofrecidos por el local.",
    href: "/restaurant/dishes",
    linkLabel: "Administrar platos",
    icon: BuildingStorefrontIcon,
  },
  {
    title: "Cupones",
    description:
      "Crear códigos promocionales con vencimiento, porcentaje y platos asociados.",
    href: "/restaurant/coupons",
    linkLabel: "Administrar cupones",
    icon: GiftIcon,
  },
  {
    title: "Descuentos",
    description:
      "Configurar descuentos directos sobre platos seleccionados y controlar su vigencia.",
    href: "/restaurant/discounts",
    linkLabel: "Administrar descuentos",
    icon: PercentBadgeIcon,
  },
  {
    title: "Horarios",
    description:
      "Definir horarios de servicio y mantener actualizada la disponibilidad operativa.",
    href: "/restaurant/schedules",
    linkLabel: "Configurar horarios",
    icon: ClockIcon,
  },
  {
    title: "Pedidos",
    description:
      "Consultar el historial de pedidos del local sin modificar su estado operativo.",
    href: "/restaurant/orders",
    linkLabel: "Ver pedidos",
    icon: InboxIcon,
  },
  {
    title: "Clientes",
    description:
      "Consultar clientes asociados al local y revisar información histórica de consumo.",
    href: "/restaurant/customers",
    linkLabel: "Ver clientes",
    icon: UsersIcon,
  },
  {
    title: "Estadísticas",
    description:
      "Analizar indicadores comerciales, ventas, pedidos y rendimiento del local.",
    href: "/restaurant/statistics",
    linkLabel: "Ver estadísticas",
    icon: ArrowTrendingUpIcon,
  },
];

export default function RestaurantQuickActions() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasHiddenLeftActions, setHasHiddenLeftActions] = useState(false);
  const [hasHiddenRightActions, setHasHiddenRightActions] = useState(false);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer) {
      return;
    }

    function updateScrollMask() {
      const maxScrollLeft =
        scrollContainer.scrollWidth - scrollContainer.clientWidth;

      setHasHiddenLeftActions(scrollContainer.scrollLeft > 1);
      setHasHiddenRightActions(scrollContainer.scrollLeft < maxScrollLeft - 1);
    }

    updateScrollMask();
    scrollContainer.addEventListener("scroll", updateScrollMask, {
      passive: true,
    });
    window.addEventListener("resize", updateScrollMask);

    return () => {
      scrollContainer.removeEventListener("scroll", updateScrollMask);
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
          Opciones priorizadas según las tareas más frecuentes del local.
        </p>
      </div>

      <div
        ref={scrollContainerRef}
        className={clsx(
          "hide-scrollbar grid auto-cols-[minmax(230px,76vw)] grid-flow-col grid-rows-2 gap-3 overflow-x-auto pb-1 sm:auto-cols-[minmax(260px,42vw)] sm:gap-4 lg:grid-flow-row lg:grid-cols-3 lg:grid-rows-none lg:auto-cols-auto lg:overflow-visible lg:pb-0 lg:[mask-image:none]",
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
