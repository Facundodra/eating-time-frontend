import type { LocalSchedule } from "@/lib/local-schedule/types";

const bypassSchedules: Record<string, LocalSchedule> = {
  "dev-local": {
    localId: "dev-local",
    alwaysOpen: false,
    paused: false,
    days: [
      {
        id: "monday",
        label: "Lunes",
        enabled: true,
        startTime: "10:00",
        endTime: "22:00",
        crossesMidnight: false,
      },
      {
        id: "tuesday",
        label: "Martes",
        enabled: true,
        startTime: "10:00",
        endTime: "22:00",
        crossesMidnight: false,
      },
      {
        id: "wednesday",
        label: "Miercoles",
        enabled: true,
        startTime: "10:00",
        endTime: "22:00",
        crossesMidnight: false,
      },
      {
        id: "thursday",
        label: "Jueves",
        enabled: true,
        startTime: "10:00",
        endTime: "22:00",
        crossesMidnight: false,
      },
      {
        id: "friday",
        label: "Viernes",
        enabled: true,
        startTime: "10:00",
        endTime: "23:30",
        crossesMidnight: false,
      },
      {
        id: "saturday",
        label: "Sabado",
        enabled: true,
        startTime: "10:00",
        endTime: "23:30",
        crossesMidnight: false,
      },
      {
        id: "sunday",
        label: "Domingo",
        enabled: false,
        startTime: "10:00",
        endTime: "22:00",
        crossesMidnight: false,
      },
    ],
  },
};

export async function getLocalSchedule(localId: string): Promise<LocalSchedule> {
  // TODO: Replace this bypass with GET api/locals/{id}/schedule.
  // Expected future shape:
  // const response = await fetch(`${process.env.API_URL}/api/locals/${localId}/schedule`);
  // return response.json();
  return getLocalScheduleWithBypass(localId);
}

export async function getLocalScheduleWithBypass(
  localId: string,
): Promise<LocalSchedule> {
  return bypassSchedules[localId] ?? { ...bypassSchedules["dev-local"], localId };
}
