"use client";

import type { ReactNode } from "react";

import LoadingIndicator from "@/ui/shared/feedback/loading-indicator";

type ChartPanelProps = {
  title: string;
  description: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  headerExtra?: ReactNode;
  children: ReactNode;
};

export default function ChartPanel({
  title,
  description,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "No hay datos para el período seleccionado.",
  headerExtra,
  children,
}: ChartPanelProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-gray-100 px-4 py-5 dark:border-slate-800 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
          {headerExtra}
        </div>
      </div>

      <div className="min-w-0 overflow-hidden p-3 sm:p-5">
        {isLoading ? (
          <div className="py-10">
            <LoadingIndicator label="Cargando gráfico..." />
          </div>
        ) : isEmpty ? (
          <p className="py-10 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
            {emptyMessage}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
