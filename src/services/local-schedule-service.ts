import type {
  LocalSchedule,
  LocalScheduleDay,
} from "@/lib/local-schedule/types";

import { api } from "./api-client";

type LocalScheduleApiDay = {
  id: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  cruzaMedianoche: boolean;
  activo: boolean;
  horarioId: number;
};

type LocalScheduleApiResponse = {
  id: number;
  siempreAbierto: "S" | "N";
  localId: number;
  dias: LocalScheduleApiDay[];
};

type SaveLocalScheduleDayRequest = {
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  cruzaMedianoche: boolean;
  activo: boolean;
};

type SaveLocalScheduleRequest = {
  siempreAbierto: "S" | "N";
  dias: SaveLocalScheduleDayRequest[];
};

type UpdateLocalScheduleRequest = Partial<SaveLocalScheduleRequest>;

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

export async function getLocalSchedule(localId: string): Promise<LocalSchedule> {
  const response = await api.get<LocalScheduleApiResponse | "">(
    `/api/local/${localId}/horario`,
  );

  if (!response.data) {
    return createEmptySchedule(localId);
  }

  return mapLocalSchedule(response.data);
}

export async function createLocalSchedule(
  schedule: LocalSchedule,
): Promise<void> {
  await api.post(
    `/api/local/${schedule.localId}/horario`,
    mapCreateLocalScheduleRequest(schedule),
  );
}

export async function saveLocalSchedule(schedule: LocalSchedule): Promise<void> {
  if (schedule.scheduleId) {
    await updateLocalSchedule(
      schedule.localId,
      mapUpdateLocalScheduleRequest(schedule),
    );
    return;
  }

  await createLocalSchedule(schedule);
}

export async function updateAlwaysOpen(
  schedule: LocalSchedule,
): Promise<void> {
  if (!schedule.scheduleId) {
    await createLocalSchedule(schedule);
    return;
  }

  await updateLocalSchedule(schedule.localId, {
    siempreAbierto: schedule.alwaysOpen ? "S" : "N",
  });
}

async function updateLocalSchedule(
  localId: string,
  request: UpdateLocalScheduleRequest,
): Promise<void> {
  await api.patch(`/api/local/${localId}/horario`, request);
}

function mapLocalSchedule(response: LocalScheduleApiResponse): LocalSchedule {
  const apiDaysById = new Map(
    response.dias.map((day) => [day.diaSemana, day]),
  );

  return {
    scheduleId: String(response.id),
    localId: String(response.localId),
    alwaysOpen: response.siempreAbierto === "S",
    paused: false,
    days: weekDays.map((day) => mapLocalScheduleDay(day, apiDaysById)),
  };
}

function mapLocalScheduleRequest(
  schedule: LocalSchedule,
  includeInactiveDays: boolean,
): SaveLocalScheduleRequest {
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

function mapCreateLocalScheduleRequest(schedule: LocalSchedule) {
  return mapLocalScheduleRequest(schedule, false);
}

function mapUpdateLocalScheduleRequest(schedule: LocalSchedule) {
  return mapLocalScheduleRequest(schedule, true);
}

function getApiDayId(dayId: string) {
  const day = weekDays.find((weekDay) => weekDay.id === dayId);

  if (!day) {
    throw new Error(`Dia de horario invalido: ${dayId}`);
  }

  return day.apiId;
}

function mapLocalScheduleDay(
  day: (typeof weekDays)[number],
  apiDaysById: Map<string, LocalScheduleApiDay>,
): LocalScheduleDay {
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

function createEmptySchedule(localId: string): LocalSchedule {
  return {
    localId,
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
