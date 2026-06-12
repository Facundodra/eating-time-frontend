import { redirect } from "next/navigation";

import { getBackendRoleHomePath } from "@/lib/shared/auth/routes";
import { getServerSession } from "@/lib/shared/auth/server-session";
import RestaurantNotificationStream from "@/ui/restaurant/notifications/restaurant-notification-stream";
import SideNav from "@/ui/restaurant/sidenav";
import Topnav from "@/ui/restaurant/topnav";

export default async function RestaurantLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Este layout es la barrera de entrada para todo /restaurant/*.
  // Valida la cookie JSESSIONID contra /api/auth/me una sola vez para el
  // render server, controla el rol y reutiliza esa sesión en el menú lateral.
  const session = await getServerSession();

  if (!session) {
    redirect("/login?reason=auth-required");
  }

  if (session.tipoUsuario !== "LOCAL") {
    redirect(getBackendRoleHomePath(session.tipoUsuario));
  }

  return (
    <div className="flex min-h-screen flex-wrap bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <SideNav session={session} />

      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
        <Topnav session={session} />
        {children}
      </main>
      <RestaurantNotificationStream restaurantId={session.idTipoUsuario} />
    </div>
  );
}
