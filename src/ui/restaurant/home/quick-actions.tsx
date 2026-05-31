import {
  ArrowTrendingUpIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  GiftIcon,
  Squares2X2Icon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

const actions = [
  {
    title: "Mesa de trabajo",
    description:
      "Visualizar pedidos del dia por estado: pendientes, aceptados, en curso, en camino y finalizados.",
    href: "/restaurant/workbench",
    linkLabel: "Gestionar pedidos",
    icon: Squares2X2Icon,
  },
  {
    title: "Platos y disponibilidad",
    description:
      "Dar de alta, modificar, eliminar y cambiar la disponibilidad de platos ofrecidos.",
    href: "/restaurant/dishes",
    linkLabel: "Administrar platos",
    icon: BuildingStorefrontIcon,
  },
  {
    title: "Cupones y descuentos",
    description:
      "Crear promociones con fecha de vencimiento, porcentaje de descuento y platos asociados.",
    href: "/restaurant/coupons",
    linkLabel: "Ver promociones",
    icon: GiftIcon,
  },
  {
    title: "Horarios y estado",
    description:
      "Definir horarios del dia y activar fuera de servicio cuando el local no pueda recibir pedidos.",
    href: "/restaurant/schedules",
    linkLabel: "Configurar horarios",
    icon: ClockIcon,
  },
  {
    title: "Reclamos y vouchers",
    description:
      "Evaluar reclamos, aceptar o rechazar la solicitud y generar vouchers de compensacion.",
    href: "/restaurant/claims",
    linkLabel: "Atender reclamos",
    icon: ChatBubbleLeftIcon,
  },
  {
    title: "Estadisticas",
    description:
      "Consultar ventas, pedidos, platos mas vendidos, promociones utilizadas y calificacion del local.",
    href: "/restaurant/statistics",
    linkLabel: "Ver estadisticas",
    icon: ArrowTrendingUpIcon,
  },
];

export default function RestaurantQuickActions() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">
          Accesos principales
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Opciones priorizadas segun las tareas mas frecuentes del local.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <article
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              key={action.title}
            >
              <Icon className="h-5 w-5 text-orange-600" />
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
    </section>
  );
}
