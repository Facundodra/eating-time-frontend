"use client";

import { ClockIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useState } from "react";

import { useAsyncData } from "@/hooks/shared/use-async-data";
import type {
  RestaurantSchedule,
  RestaurantScheduleDay,
} from "@/lib/restaurant/schedule/types";
import {
  getRestaurantServiceStatus,
  updateRestaurantServiceStatus,
} from "@/services/restaurant/service-status-service";
import { notifyRestaurantAvailabilityRefresh } from "@/services/restaurant/availability-service";
import {
  getRestaurantSchedule,
  saveRestaurantSchedule,
  updateAlwaysOpen,
} from "@/services/restaurant/schedule-service";
import { getCurrentSession } from "@/services/shared/auth-service";
import LoadingButton from "@/ui/shared/buttons/loading-button";
import LoadingIndicator from "@/ui/shared/feedback/loading-indicator";
import PanelError from "@/ui/shared/feedback/panel-error";

function Toggle({
  checked,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      onClick={onChange}
      disabled={disabled}
      className={clsx(
        "relative h-7 w-12 cursor-pointer rounded-full transition focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-orange-500/20",
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

async function loadRestaurantSchedule(): Promise<RestaurantSchedule> {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error("No se encontró una sesión activa.");
  }

  const restaurantId = String(session.idTipoUsuario);
  const [restaurantSchedule, serviceEnabled] = await Promise.all([
    getRestaurantSchedule(restaurantId),
    getRestaurantServiceStatus(restaurantId),
  ]);

  return {
    ...restaurantSchedule,
    paused: !serviceEnabled,
  };
}

export default function RestaurantSchedulesPage() {
  // La pagina se renderiza inmediatamente y los datos del backend se cargan en
  // segundo plano. Cada panel decide si muestra loader, error o controles reales.
  const {
    data: loadedSchedule,
    error: loadError,
    isLoading,
    reload,
  } = useAsyncData(loadRestaurantSchedule);
  const [restaurantId, setRestaurantId] = useState("");
  const [alwaysOpen, setAlwaysOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [schedule, setSchedule] = useState<RestaurantScheduleDay[]>([]);
  const [scheduleId, setScheduleId] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [isUpdatingAlwaysOpen, setIsUpdatingAlwaysOpen] = useState(false);
  const [isUpdatingServiceStatus, setIsUpdatingServiceStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [alwaysOpenError, setAlwaysOpenError] = useState("");
  const [serviceStatusError, setServiceStatusError] = useState("");

  // Cuando llega una nueva respuesta del backend, sincronizamos el estado editable
  // del formulario. Esto tambien se usa al reintentar o cancelar cambios.
  useEffect(() => {
    if (!loadedSchedule) {
      return;
    }

    applySchedule(loadedSchedule);
  }, [loadedSchedule]);

  // Mantiene todos los estados locales alineados con una foto completa del horario.
  function applySchedule(nextSchedule: RestaurantSchedule) {
    setRestaurantId(nextSchedule.restaurantId);
    setAlwaysOpen(nextSchedule.alwaysOpen);
    setPaused(nextSchedule.paused);
    setSchedule(nextSchedule.days);
    setScheduleId(nextSchedule.scheduleId);
  }

  function updateDay(dayId: string, updates: Partial<RestaurantScheduleDay>) {
    setSchedule((currentSchedule) =>
      currentSchedule.map((day) =>
        day.id === dayId ? { ...day, ...updates } : day,
      ),
    );
  }

  // Arma el payload desde el estado editable actual antes de persistirlo.
  function buildCurrentSchedule(updates?: Partial<RestaurantSchedule>): RestaurantSchedule {
    if (!restaurantId) {
      throw new Error("No se encontró el local para actualizar horarios.");
    }

    return {
      scheduleId,
      restaurantId,
      alwaysOpen,
      paused,
      days: schedule,
      ...updates,
    };
  }

  // Este switch puede crear el horario si todavia no existe, por eso usa el mismo
  // payload completo aunque solo cambie "siempre abierto".
  async function handleAlwaysOpenChange() {
    if (!loadedSchedule) {
      return;
    }

    const nextAlwaysOpen = !alwaysOpen;

    setStatusMessage("");
    setErrorMessage("");
    setAlwaysOpenError("");
    setAlwaysOpen(nextAlwaysOpen);
    setIsUpdatingAlwaysOpen(true);

    try {
      await updateAlwaysOpen(
        buildCurrentSchedule({ alwaysOpen: nextAlwaysOpen }),
      );
      setScheduleId((currentScheduleId) => currentScheduleId ?? "created");
      notifyRestaurantAvailabilityRefresh();
    } catch {
      setAlwaysOpen(alwaysOpen);
      setAlwaysOpenError(
        "No se pudo actualizar siempre abierto. Intentalo nuevamente.",
      );
    } finally {
      setIsUpdatingAlwaysOpen(false);
    }
  }

  // La pausa manual se guarda en el endpoint de estado de servicio, separado de
  // la definicion semanal de horarios.
  async function handleServiceStatusChange() {
    if (!loadedSchedule) {
      return;
    }

    const nextPaused = !paused;

    setStatusMessage("");
    setErrorMessage("");
    setServiceStatusError("");
    setPaused(nextPaused);
    setIsUpdatingServiceStatus(true);

    try {
      await updateRestaurantServiceStatus(restaurantId, !nextPaused);
      notifyRestaurantAvailabilityRefresh();
    } catch {
      setPaused(paused);
      setServiceStatusError(
        "No se pudo actualizar el estado de servicio. Intentalo nuevamente.",
      );
    } finally {
      setIsUpdatingServiceStatus(false);
    }
  }

  // Persiste la definicion semanal completa que el usuario edito en pantalla.
  async function handleSubmit() {
    if (!loadedSchedule) {
      return;
    }

    setStatusMessage("");
    setErrorMessage("");

    setIsSaving(true);

    try {
      await saveRestaurantSchedule(buildCurrentSchedule());
      setScheduleId((currentScheduleId) => currentScheduleId ?? "created");
      setStatusMessage("Horario guardado correctamente.");
      notifyRestaurantAvailabilityRefresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el horario. Intentalo nuevamente.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  // Descarta cambios locales volviendo a consultar backend, sin recargar la pagina.
  async function handleCancelChanges() {
    if (!loadedSchedule) {
      return;
    }

    setStatusMessage("");
    setErrorMessage("");
    setAlwaysOpenError("");
    setServiceStatusError("");
    setIsReloading(true);

    try {
      const [restaurantSchedule, serviceEnabled] = await Promise.all([
        getRestaurantSchedule(restaurantId),
        getRestaurantServiceStatus(restaurantId),
      ]);

      applySchedule({
        ...restaurantSchedule,
        paused: !serviceEnabled,
      });
    } catch {
      setErrorMessage("No se pudo recargar el horario. Intentalo nuevamente.");
    } finally {
      setIsReloading(false);
    }
  }

  // Ambos paneles dependen de la misma carga inicial, pero renderizan su propio
  // loader/error para que la pagina real ya este visible mientras llegan los datos.
  const isDataReady = Boolean(loadedSchedule) && !isLoading && !loadError;
  const loadErrorMessage =
    loadError?.message ?? "No se pudieron cargar los horarios.";

  return (
    <form
      className="space-y-6 pb-4"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
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
          {isLoading ? (
            <div className="py-4 md:col-span-2">
              <LoadingIndicator label="Cargando estado de servicio..." />
            </div>
          ) : loadError ? (
            <div className="md:col-span-2">
              <PanelError message={loadErrorMessage} onRetry={reload} />
            </div>
          ) : (
            <>
              <div className="flex min-h-[64px] items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 dark:border-slate-800">
                <div>
                  <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Siempre abierto
                  </span>
                  {alwaysOpenError ? (
                    <p className="mt-1 text-xs font-bold text-red-500">
                      {alwaysOpenError}
                    </p>
                  ) : null}
                </div>
                <Toggle
                  checked={alwaysOpen}
                  disabled={isUpdatingAlwaysOpen || isSaving}
                  label="Cambiar siempre abierto"
                  onChange={() => void handleAlwaysOpenChange()}
                />
              </div>

              <div className="flex min-h-[64px] items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 dark:border-slate-800">
                <div>
                  <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Fuera de servicio
                  </span>
                  {serviceStatusError ? (
                    <p className="mt-1 text-xs font-bold text-red-500">
                      {serviceStatusError}
                    </p>
                  ) : null}
                </div>
                <Toggle
                  checked={paused}
                  disabled={isUpdatingServiceStatus}
                  label="Cambiar fuera de servicio"
                  onChange={() => void handleServiceStatusChange()}
                />
              </div>
            </>
          )}
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
            {isLoading ? (
              <div className="py-8">
                <LoadingIndicator label="Cargando definición de horarios..." />
              </div>
            ) : loadError ? (
              <PanelError message={loadErrorMessage} onRetry={reload} />
            ) : (
              schedule.map((day) => (
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
              ))
            )}
          </div>

          {isDataReady ? (
            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-5 py-5 sm:flex-row sm:justify-end dark:border-slate-800">
              {statusMessage ? (
                <p className="self-center text-sm font-bold text-green-600">
                  {statusMessage}
                </p>
              ) : null}
              {errorMessage ? (
                <p className="self-center text-sm font-bold text-red-500">
                  {errorMessage}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => void handleCancelChanges()}
                disabled={isReloading || isSaving}
                className="h-11 cursor-pointer rounded-xl bg-orange-50 px-5 text-sm font-extrabold text-orange-600 transition hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
              >
                {isReloading ? "Recargando..." : "Cancelar cambios"}
              </button>
              <LoadingButton
                type="submit"
                isLoading={isSaving}
                loadingText="Guardando..."
                className="h-11 cursor-pointer rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-500/20"
              >
                Guardar horarios
              </LoadingButton>
            </div>
          ) : null}
        </section>
      </div>
    </form>
  );
}
