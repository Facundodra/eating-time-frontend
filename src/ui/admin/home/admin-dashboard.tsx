import AdminHero from "./admin-hero";
import AdminPendingRequests from "./admin-pending-requests";
import AdminQuickActions from "./admin-quick-actions";

export default function AdminDashboard() {
  return (
    <section className="space-y-6">
      <AdminHero />
      <AdminQuickActions />
      <AdminPendingRequests />
    </section>
  );
}
