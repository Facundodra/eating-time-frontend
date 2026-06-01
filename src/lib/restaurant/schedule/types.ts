export type RestaurantScheduleDay = {
  id: string;
  label: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  crossesMidnight: boolean;
};

export type RestaurantSchedule = {
  scheduleId?: string;
  restaurantId: string;
  alwaysOpen: boolean;
  paused: boolean;
  days: RestaurantScheduleDay[];
};
