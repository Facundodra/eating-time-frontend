import { redirect } from "next/navigation";

import { getBackendRoleHomePath } from "@/lib/shared/auth/routes";
import { getServerSession } from "@/lib/shared/auth/server-session";
import Header from "@/ui/client/header";
import ClientNotificationStream from "@/ui/client/notifications/client-notification-stream";
import ClientOrderRatingPrompt from "@/ui/client/ratings/client-order-rating-prompt";

export default async function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login?reason=auth-required");
  }

  if (session.tipoUsuario !== "CLIENTE") {
    redirect(getBackendRoleHomePath(session.tipoUsuario));
  }

  return (
    <div className="client-brand-font client-theme-scope min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <Header session={session} />
      <main className="min-h-[100vh] bg-slate-100 px-5 py-10 dark:bg-slate-950 md:px-10">
        {children}
      </main>
      <ClientNotificationStream clientId={session.idTipoUsuario} />
      <ClientOrderRatingPrompt />
    </div>
  );
}
