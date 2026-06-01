import RestaurantQuickActions from "./quick-actions";
import RestaurantRecentOrders from "./recent-orders";
import RestaurantStats from "./stats";

export default function RestaurantDashboard() {
  return (
    <section className="space-y-6">
      <RestaurantStats />
      <RestaurantQuickActions />
      <RestaurantRecentOrders />
    </section>
  );
}
