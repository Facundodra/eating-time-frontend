"use client";

import { ClockIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useState } from "react";

import type {
  LocalSchedule,
  LocalScheduleDay,
} from "@/lib/local-schedule/types";

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      onClick={onChange}
      className={clsx(
        "relative h-7 w-12 cursor-pointer rounded-full transition focus:outline-none focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-500/20",
        checked ? "bg-orange-600" : "bg-slate-300 dark:bg-slate-700",
      )}
    >
      <span
        className={clsx(
          "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition",
          checked ? "left-6" : "left-1",
        )}
      />
    </button>
  );
}

function TimeField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-xs font-extrabold text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <span className="relative block">
        <input
          id={id}
          type="time"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 pr-11 text-sm font-medium text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
        />
        <ClockIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </span>
    </label>
  );
}

function CrossesMidnightField({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex h-11 cursor-pointer items-center gap-3 self-end rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:bg-orange-500/10"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-orange-600"
      />
      <span>Cruza la medianoche</span>
    </label>
  );
}

export default function RestaurantSchedulesPage({
  initialSchedule,
}: {
  initialSchedule: LocalSchedule;
}) {
  const [alwaysOpen, setAlwaysOpen] = useState(initialSchedule.alwaysOpen);
  const [paused, setPaused] = useState(initialSchedule.paused);
  const [schedule, setSchedule] = useState(initialSchedule.days);

  function updateDay(dayId: string, updates: Partial<LocalScheduleDay>) {
    setSchedule((currentSchedule) =>
      currentSchedule.map((day) =>
        day.id === dayId ? { ...day, ...updates } : day,
      ),
    );
  }

  return (
    <form
      className="space-y-6 pb-4"
      onSubmit={(event) => event.preventDefault()}
    >
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
            Estado de servicio
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            La pausa manual prevalece sobre el horario automatico.
          </p>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="flex min-h-[64px] items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 dark:border-slate-800">
            <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Siempre abierto
            </span>
            <Toggle
              checked={alwaysOpen}
              label="Cambiar siempre abierto"
              onChange={() => setAlwaysOpen((value) => !value)}
            />
          </div>

          <div className="flex min-h-[64px] items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 dark:border-slate-800">
            <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Fuera de servicio
            </span>
            <Toggle
              checked={paused}
              label="Cambiar fuera de servicio"
              onChange={() => setPaused((value) => !value)}
            />
          </div>
        </div>
      </section>

      <div
        aria-hidden={alwaysOpen}
        className={clsx(
          "grid overflow-hidden transition-[grid-template-rows,opacity,transform] duration-300 ease-out",
          alwaysOpen
            ? "grid-rows-[0fr] -translate-y-2 opacity-0"
            : "grid-rows-[1fr] translate-y-0 opacity-100",
        )}
      >
        <section
          className={clsx(
            "min-h-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-transform duration-300 ease-out dark:border-slate-800 dark:bg-slate-900",
            alwaysOpen ? "pointer-events-none" : "pointer-events-auto",
          )}
        >
          <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
              Definicion de horarios
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              Configura la hora de inicio y fin de servicio para cada dia.
            </p>
          </div>

          <div className="space-y-5 px-5 py-6">
            {schedule.map((day) => (
              <div
                key={day.id}
                className="grid gap-4 xl:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)_220px] xl:items-center"
              >
                <div className="flex items-center justify-between gap-4 xl:justify-start xl:gap-8">
                  <div className="min-w-[86px]">
                    <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                      {day.label}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                      Jornada de servicio
                    </p>
                  </div>
                  <Toggle
                    checked={day.enabled}
                    label={`Cambiar jornada de ${day.label}`}
                    onChange={() =>
                      updateDay(day.id, { enabled: !day.enabled })
                    }
                  />
                </div>

                {day.enabled ? (
                  <>
                    <TimeField
                      id={`${day.id}-start`}
                      label="Hora de inicio"
                      value={day.startTime}
                      onChange={(value) =>
                        updateDay(day.id, { startTime: value })
                      }
                    />
                    <TimeField
                      id={`${day.id}-end`}
                      label="Hora de fin"
                      value={day.endTime}
                      onChange={(value) =>
                        updateDay(day.id, { endTime: value })
                      }
                    />
                    <CrossesMidnightField
                      id={`${day.id}-crosses-midnight`}
                      checked={day.crossesMidnight}
                      onChange={(checked) =>
                        updateDay(day.id, { crossesMidnight: checked })
                      }
                    />
                  </>
                ) : (
                  <p className="text-sm font-extrabold text-red-500 xl:col-span-3">
                    Sin atencion configurada
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-5 py-5 sm:flex-row sm:justify-end dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAlwaysOpen(initialSchedule.alwaysOpen);
                setPaused(initialSchedule.paused);
                setSchedule(initialSchedule.days);
              }}
              className="h-11 cursor-pointer rounded-xl bg-orange-50 px-5 text-sm font-extrabold text-orange-600 transition hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
            >
              Cancelar cambios
            </button>
            <button
              type="submit"
              className="h-11 cursor-pointer rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-500/20"
            >
              Guardar horarios
            </button>
          </div>
        </section>
      </div>
    </form>
  );
}
