import {
  ArchiveBoxIcon,
  ChatBubbleLeftIcon,
  CurrencyDollarIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

const stats = [
  {
    label: "Pedidos activos",
    value: "8",
    tag: "Hoy",
    icon: TrophyIcon,
    tagClassName: "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
  },
  {
    label: "Ingresos del dia",
    value: "$ 18.450",
    tag: "Hoy",
    icon: CurrencyDollarIcon,
    tagClassName: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
  },
  {
    label: "Platos publicados",
    value: "24",
    tag: "Disponible",
    icon: ArchiveBoxIcon,
    tagClassName: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
  },
  {
    label: "Reclamos por atender",
    value: "3",
    tag: "Pendientes",
    icon: ChatBubbleLeftIcon,
    tagClassName: "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
  },
];

export default function RestaurantStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <article
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            key={stat.label}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="rounded-xl bg-orange-50 p-2 text-orange-600 dark:bg-orange-500/10">
                <Icon className="h-5 w-5" />
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${stat.tagClassName}`}
              >
                {stat.tag}
              </span>
            </div>
            <p className="mt-5 text-3xl font-bold text-slate-950 dark:text-white">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {stat.label}
            </p>
          </article>
        );
      })}
    </div>
  );
}
