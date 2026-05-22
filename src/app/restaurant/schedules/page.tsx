import { getLocalSchedule } from "@/services/local-schedule-service";
import RestaurantSchedulesPage from "@/ui/restaurant/schedules/restaurant-schedules-page";

export default async function SchedulesPage() {
  const schedule = await getLocalSchedule("dev-local");

  return <RestaurantSchedulesPage initialSchedule={schedule} />;
}
