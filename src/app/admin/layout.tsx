import { redirect } from "next/navigation";

import { getBackendRoleHomePath } from "@/lib/shared/auth/routes";
import { getServerSession } from "@/lib/shared/auth/server-session";
import SideNav from "@/ui/admin/sidenav";
import Topnav from "@/ui/admin/topnav";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Este layout es la barrera de entrada para todo /admin/*.
  // Valida la cookie JSESSIONID contra /api/auth/me una sola vez para el
  // render server, controla el rol y reutiliza esa sesión en el menú lateral.
  const session = await getServerSession();

  if (!session) {
    redirect("/login?reason=auth-required");
  }

  if (session.tipoUsuario !== "ADMIN") {
    redirect(getBackendRoleHomePath(session.tipoUsuario));
  }

  return (
    <div className="flex min-h-screen flex-wrap bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <SideNav session={session} />

      <main className="min-w-0 flex-1 p-6 lg:p-10">
        <Topnav session={session} />
        {children}
      </main>
    </div>
  );
}
