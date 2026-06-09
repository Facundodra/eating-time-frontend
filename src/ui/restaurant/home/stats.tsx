import {
  ArchiveBoxIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

import type { RestaurantDashboardStat } from "@/lib/restaurant/dashboard/types";

const statIcons = [
  TrophyIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
];

const tagClassNames: Record<RestaurantDashboardStat["tone"], string> = {
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

type RestaurantStatsProps = {
  isLoading: boolean;
  stats: RestaurantDashboardStat[];
};

export default function RestaurantStats({
  isLoading,
  stats,
}: RestaurantStatsProps) {
  const visibleStats = isLoading
    ? Array.from({ length: 4 }).map<RestaurantDashboardStat>(() => ({
        label: "Cargando",
        tag: "...",
        tone: "slate",
        value: "...",
      }))
    : stats;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {visibleStats.map((stat, index) => {
        const Icon = statIcons[index] ?? TrophyIcon;

        return (
          <article
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900"
            key={`${stat.label}-${index}`}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="rounded-xl bg-orange-50 p-2 text-orange-600 dark:bg-orange-500/10">
                <Icon className="h-5 w-5" />
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${tagClassNames[stat.tone]}`}
              >
                {stat.tag}
              </span>
            </div>
            <p className="mt-5 text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white">
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
