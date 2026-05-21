import RestaurantQuickActions from "./restaurant-quick-actions";
import RestaurantRecentOrders from "./restaurant-recent-orders";
import RestaurantStats from "./restaurant-stats";

export default function RestaurantDashboard() {
  return (
    <section className="space-y-6">
      <RestaurantStats />
      <RestaurantQuickActions />
      <RestaurantRecentOrders />
    </section>
  );
}
