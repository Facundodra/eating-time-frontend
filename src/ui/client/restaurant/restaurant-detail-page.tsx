"use client";

import { useEffect, useState } from "react";

import { getRestaurant, getCart } from "@/services/client/client-service";
import type { RestaurantSchedule } from "@/lib/restaurant/schedule/types";
import type { Cart, Restaurant } from "@/lib/client/types";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  MoonIcon,
  ShoppingCartIcon,
  StarIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

import Link from "next/link";
import Image from "next/image";
import { getRestaurantAvailability } from "@/services/restaurant/availability-service";
import { getRestaurantServiceStatus } from "@/services/restaurant/service-status-service";
import { getRestaurantSchedule } from "@/services/restaurant/schedule-service";
import DishesList from "@/ui/client/dishes/dishes-list";

type BusinessScheduleState = {
  schedule: RestaurantSchedule | null;
  serviceEnabled: boolean | null;
  available: boolean | null;
};

const emptyBusinessSchedule: BusinessScheduleState = {
  schedule: null,
  serviceEnabled: null,
  available: null,
};

function getStatusBadge(
  restaurantState: boolean,
  businessSchedule: BusinessScheduleState,
  isLoading: boolean,
) {
  if (
    isLoading &&
    businessSchedule.available == null &&
    businessSchedule.serviceEnabled == null
  ) {
    return {
      label: "Consultando",
      className: "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400",
    };
  }

  if (businessSchedule.serviceEnabled === false) {
    return {
      label: "Fuera de servicio",
      className: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
    };
  }

  const isOpen = businessSchedule.available ?? restaurantState;

  return isOpen
    ? {
        label: "Abierto",
        className: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300",
      }
    : {
        label: "Cerrado",
        className: "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400",
      };
}

function formatScheduleRange(day: RestaurantSchedule["days"][number]) {
  const range = `${day.startTime} - ${day.endTime}`;
  return day.crossesMidnight ? `${range} (+1)` : range;
}

type ScheduleGroup = {
  label: string;
  range: string;
};

function getScheduleGroups(days: RestaurantSchedule["days"]): ScheduleGroup[] {
  const groups: ScheduleGroup[] = [];
  let currentDays: RestaurantSchedule["days"] = [];
  let currentRange = "";

  function pushCurrentGroup() {
    if (currentDays.length === 0) return;

    const firstDay = currentDays[0];
    const lastDay = currentDays[currentDays.length - 1];
    const label =
      currentDays.length === 1
        ? firstDay.label
        : currentDays.length === 2
          ? `${firstDay.label} y ${lastDay.label.toLowerCase()}`
          : `${firstDay.label} a ${lastDay.label.toLowerCase()}`;

    groups.push({ label, range: currentRange });
  }

  days
    .filter((day) => day.enabled)
    .forEach((day) => {
      const range = formatScheduleRange(day);

      if (currentDays.length === 0 || range === currentRange) {
        currentDays.push(day);
        currentRange = range;
        return;
      }

      pushCurrentGroup();
      currentDays = [day];
      currentRange = range;
    });

  pushCurrentGroup();
  return groups;
}

function RestaurantBusinessSchedule({
  schedule,
  serviceEnabled,
  available,
  loading,
  error,
}: BusinessScheduleState & {
  loading: boolean;
  error: string | null;
}) {
  const scheduleGroups = schedule ? getScheduleGroups(schedule.days) : [];
  const availabilityLabel =
    serviceEnabled === false
      ? "Fuera de servicio"
      : available == null
        ? null
        : available
        ? "Abierto"
        : "Cerrado";

  return (
    <div className="mt-4 border-t border-gray-100 pt-4 dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-slate-500 dark:text-slate-400">
          <CalendarDaysIcon className="h-4 w-4" />
          Horario del local
        </span>
        {availabilityLabel ? (
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 dark:bg-orange-500/10 dark:text-orange-300">
            {availabilityLabel}
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-3 space-y-2 animate-pulse">
          <div className="h-3 w-44 rounded bg-gray-100 dark:bg-slate-800" />
          <div className="h-3 w-64 max-w-full rounded bg-gray-100 dark:bg-slate-800" />
        </div>
      ) : error ? (
        <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          Horario no disponible por el momento.
        </p>
      ) : schedule?.alwaysOpen ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <ClockIcon className="h-4 w-4 text-orange-600 dark:text-orange-300" />
          Siempre abierto
        </p>
      ) : scheduleGroups.length > 0 ? (
        <div className="mt-3 grid gap-y-2 text-sm sm:max-w-[560px]">
          {scheduleGroups.map((group) => (
            <div
              key={`${group.label}-${group.range}`}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4"
            >
              <span className="min-w-0 font-black text-slate-700 dark:text-slate-200">
                {group.label}
              </span>
              <span className="whitespace-nowrap text-slate-500 dark:text-slate-400">
                {group.range}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Sin horario configurado.
        </p>
      )}
    </div>
  );
}

export default function RestaurantDetailPage({ id }: { id: string }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [cart, setCart] = useState<Cart | null>(null);
  const [businessSchedule, setBusinessSchedule] =
    useState<BusinessScheduleState>(emptyBusinessSchedule);
  const [businessScheduleLoading, setBusinessScheduleLoading] = useState(true);
  const [businessScheduleError, setBusinessScheduleError] = useState<string | null>(null);

  useEffect(() => {
    getRestaurant(id)
      .then(setRestaurant)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error al cargar"),
      );

    // Carga el carrito existente para este restaurante (null si no hay)
    getCart(Number(id)).then(setCart).catch(() => setCart(null));
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function loadBusinessSchedule() {
      setBusinessSchedule(emptyBusinessSchedule);
      setBusinessScheduleLoading(true);
      setBusinessScheduleError(null);

      const [scheduleResult, serviceStatusResult, availabilityResult] =
        await Promise.allSettled([
          getRestaurantSchedule(id),
          getRestaurantServiceStatus(id),
          getRestaurantAvailability(id),
        ]);

      if (cancelled) return;

      setBusinessSchedule({
        schedule:
          scheduleResult.status === "fulfilled" ? scheduleResult.value : null,
        serviceEnabled:
          serviceStatusResult.status === "fulfilled"
            ? serviceStatusResult.value
            : null,
        available:
          availabilityResult.status === "fulfilled"
            ? availabilityResult.value
            : null,
      });
      setBusinessScheduleError(
        scheduleResult.status === "rejected"
          ? "No se pudo cargar el horario del local."
          : null,
      );
      setBusinessScheduleLoading(false);
    }

    void loadBusinessSchedule();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const cartItemCount =
    cart?.items.filter((i) => i.eliminacion == null).reduce((sum, i) => sum + i.cantidad, 0) ?? 0;

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      </div>
    );
  }

  if (!restaurant) return null;

  const statusBadge = getStatusBadge(
    restaurant.state,
    businessSchedule,
    businessScheduleLoading,
  );

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-4 py-6 pb-28">
        {/* Volver */}
        <Link
          href="/client"
          className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-gray-500 transition-colors hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-300"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Volver al listado
        </Link>

        {/* Ficha local */}
        <div className="restaurant-card mb-7 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="relative flex h-48 items-center justify-center bg-orange-50 dark:bg-orange-500/10 sm:h-60 lg:h-72">
            {restaurant.coverPhotoUrl ? (
              <Image
                src={restaurant.coverPhotoUrl}
                alt={`Portada de ${restaurant.name}`}
                fill
                priority
                sizes="(min-width: 1440px) 1408px, calc(100vw - 2rem)"
                className="object-cover object-center"
              />
            ) : (
              <span className="text-5xl font-black text-orange-600/70 dark:text-orange-300/70">
                {restaurant.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span
              aria-label={statusBadge.label}
              title={statusBadge.label}
              className={`absolute bottom-4 right-4 inline-flex min-h-8 items-center justify-center gap-1 rounded-full px-3 py-2 text-xs font-black shadow-sm ${statusBadge.className}`}
            >
              {statusBadge.label === "Abierto" ? (
                <CheckCircleIcon className="h-4 w-4" />
              ) : statusBadge.label === "Cerrado" ? (
                <MoonIcon className="h-4 w-4" />
              ) : (
                null
              )}
              {statusBadge.label}
            </span>
          </div>

          {/* Info */}
          <div className="min-w-0 p-5 sm:p-6">
            <div>
              <div className="relative -mt-14 mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-orange-50 text-xl font-black text-orange-700 shadow-sm dark:border-slate-900 dark:bg-orange-500/10 dark:text-orange-300 sm:-mt-16 sm:h-24 sm:w-24">
                {restaurant.profilePhotoUrl ? (
                  <Image
                    src={restaurant.profilePhotoUrl}
                    alt={`Perfil de ${restaurant.name}`}
                    fill
                    sizes="(min-width: 640px) 96px, 80px"
                    className="object-cover"
                  />
                ) : (
                  restaurant.name.charAt(0).toUpperCase()
                )}
              </div>
              <h1 className="flex flex-wrap items-center gap-x-3 gap-y-2 text-lg font-extrabold text-gray-900 dark:text-white">
                {restaurant.name}
                <span className="flex align-center items-center text-sm text-orange-700 dark:text-orange-300">
                  <StarIcon className="w-[20px] mr-1"></StarIcon>{" "}
                  <span className="relative">{restaurant.stars}</span>
                  <Link href={`/client/restaurant/${id}/comentarios`} className="leading-1 ml-3 text-xs font-semibold text-gray-800 hover:text-orange-700 dark:text-slate-300 dark:hover:text-orange-300">
                    Ver comentarios
                  </Link>
                </span>
              </h1>
              <p className="descripcion text-md block text-slate-600 dark:text-slate-300">
                {restaurant.description}
              </p>
              <p className="direccion align-center mt-1 flex text-xs text-gray-700 dark:text-slate-400">
                <MapPinIcon className="w-[15px] mr-1"></MapPinIcon>
                {restaurant.address}
              </p>
              <RestaurantBusinessSchedule
                schedule={businessSchedule.schedule}
                serviceEnabled={businessSchedule.serviceEnabled}
                available={businessSchedule.available}
                loading={businessScheduleLoading}
                error={businessScheduleError}
              />
            </div>
          </div>
        </div>

        {/* Listado de platos */}
        <h2 className="mb-5 text-xl font-bold text-gray-700 dark:text-slate-100">Platos disponibles</h2>
        <DishesList
          idLocal={Number(id)}
          cart={cart}
          onCartUpdate={setCart}
        />
      </div>

      {/* Barra fija de carrito — aparece cuando hay ítems */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-lg bg-orange-700 text-white rounded-2xl shadow-xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCartIcon className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-white text-orange-700 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartItemCount}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold">Tu pedido</p>
                <p className="text-xs opacity-80">${cart?.total.toFixed(2)}</p>
              </div>
            </div>
            <Link
              href={`/client/restaurant/${id}/cart`}
              className="bg-white text-orange-700 font-bold text-sm px-5 py-2 rounded-xl hover:bg-orange-50 transition-colors"
            >
              Ver carrito
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
