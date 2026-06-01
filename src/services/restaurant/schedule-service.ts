import type {
  RestaurantSchedule,
  RestaurantScheduleDay,
} from "@/lib/restaurant/schedule/types";

import { api } from "../shared/api-client";

type RestaurantScheduleApiDay = {
  id: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  cruzaMedianoche: boolean;
  activo: boolean;
  horarioId: number;
};

type RestaurantScheduleApiResponse = {
  id: number;
  siempreAbierto: "S" | "N";
  localId: number;
  dias: RestaurantScheduleApiDay[];
};

type SaveRestaurantScheduleDayRequest = {
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  cruzaMedianoche: boolean;
  activo: boolean;
};

type SaveRestaurantScheduleRequest = {
  siempreAbierto: "S" | "N";
  dias: SaveRestaurantScheduleDayRequest[];
};

type UpdateRestaurantScheduleRequest = Partial<SaveRestaurantScheduleRequest>;

const weekDays: Array<{
  apiId: string;
  id: string;
  label: string;
}> = [
  { apiId: "L", id: "monday", label: "Lunes" },
  { apiId: "M", id: "tuesday", label: "Martes" },
  { apiId: "X", id: "wednesday", label: "Miercoles" },
  { apiId: "J", id: "thursday", label: "Jueves" },
  { apiId: "V", id: "friday", label: "Viernes" },
  { apiId: "S", id: "saturday", label: "Sabado" },
  { apiId: "D", id: "sunday", label: "Domingo" },
];

export async function getRestaurantSchedule(
  restaurantId: string,
): Promise<RestaurantSchedule> {
  const response = await api.get<RestaurantScheduleApiResponse | "">(
    `/api/local/${restaurantId}/horario`,
  );

  if (!response.data) {
    return createEmptyRestaurantSchedule(restaurantId);
  }

  return mapRestaurantSchedule(response.data);
}

export async function createRestaurantSchedule(
  schedule: RestaurantSchedule,
): Promise<void> {
  await api.post(
    `/api/local/${schedule.restaurantId}/horario`,
    mapCreateRestaurantScheduleRequest(schedule),
  );
}

export async function saveRestaurantSchedule(schedule: RestaurantSchedule): Promise<void> {
  if (schedule.scheduleId) {
    await updateRestaurantSchedule(
      schedule.restaurantId,
      mapUpdateRestaurantScheduleRequest(schedule),
    );
    return;
  }

  await createRestaurantSchedule(schedule);
}

export async function updateAlwaysOpen(
  schedule: RestaurantSchedule,
): Promise<void> {
  if (!schedule.scheduleId) {
    await createRestaurantSchedule(schedule);
    return;
  }

  await updateRestaurantSchedule(schedule.restaurantId, {
    siempreAbierto: schedule.alwaysOpen ? "S" : "N",
  });
}

async function updateRestaurantSchedule(
  restaurantId: string,
  request: UpdateRestaurantScheduleRequest,
): Promise<void> {
  await api.patch(`/api/local/${restaurantId}/horario`, request);
}

function mapRestaurantSchedule(response: RestaurantScheduleApiResponse): RestaurantSchedule {
  const apiDaysById = new Map(
    response.dias.map((day) => [day.diaSemana, day]),
  );

  return {
    scheduleId: String(response.id),
    restaurantId: String(response.localId),
    alwaysOpen: response.siempreAbierto === "S",
    paused: false,
    days: weekDays.map((day) => mapRestaurantScheduleDay(day, apiDaysById)),
  };
}

function mapRestaurantScheduleRequest(
  schedule: RestaurantSchedule,
  includeInactiveDays: boolean,
): SaveRestaurantScheduleRequest {
  return {
    siempreAbierto: schedule.alwaysOpen ? "S" : "N",
    dias: schedule.days
      .filter((day) => includeInactiveDays || day.enabled)
      .map((day) => ({
        diaSemana: getApiDayId(day.id),
        horaInicio: day.startTime,
        horaFin: day.endTime,
        cruzaMedianoche: day.crossesMidnight,
        activo: day.enabled,
      })),
  };
}

function mapCreateRestaurantScheduleRequest(schedule: RestaurantSchedule) {
  return mapRestaurantScheduleRequest(schedule, false);
}

function mapUpdateRestaurantScheduleRequest(schedule: RestaurantSchedule) {
  return mapRestaurantScheduleRequest(schedule, true);
}

function getApiDayId(dayId: string) {
  const day = weekDays.find((weekDay) => weekDay.id === dayId);

  if (!day) {
    throw new Error(`Dia de horario invalido: ${dayId}`);
  }

  return day.apiId;
}

function mapRestaurantScheduleDay(
  day: (typeof weekDays)[number],
  apiDaysById: Map<string, RestaurantScheduleApiDay>,
): RestaurantScheduleDay {
  const apiDay = apiDaysById.get(day.apiId);

  return {
    id: day.id,
    label: day.label,
    enabled: apiDay?.activo ?? false,
    startTime: apiDay ? formatTime(apiDay.horaInicio) : "10:00",
    endTime: apiDay ? formatTime(apiDay.horaFin) : "22:00",
    crossesMidnight: apiDay?.cruzaMedianoche ?? false,
  };
}

function createEmptyRestaurantSchedule(restaurantId: string): RestaurantSchedule {
  return {
    restaurantId,
    alwaysOpen: false,
    paused: false,
    days: weekDays.map((day) => ({
      id: day.id,
      label: day.label,
      enabled: false,
      startTime: "10:00",
      endTime: "22:00",
      crossesMidnight: false,
    })),
  };
}

function formatTime(time: string) {
  return time.slice(0, 5);
}
