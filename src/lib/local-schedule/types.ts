export type LocalScheduleDay = {
  id: string;
  label: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  crossesMidnight: boolean;
};

export type LocalSchedule = {
  scheduleId?: string;
  localId: string;
  alwaysOpen: boolean;
  paused: boolean;
  days: LocalScheduleDay[];
};
