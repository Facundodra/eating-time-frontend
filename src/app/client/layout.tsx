import { redirect } from "next/navigation";

import { getBackendRoleHomePath } from "@/lib/shared/auth/routes";
import { getServerSession } from "@/lib/shared/auth/server-session";
import Header from "@/ui/client/header";

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
    <>
      <Header session={session} />
      <main className="px-5 md:px-10 py-10  bg-gray-100 min-h-[100vh]">{children}</main>
    </>
  );
}
