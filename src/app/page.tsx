import { redirect } from "next/navigation";

import { getBackendRoleHomePath } from "@/lib/shared/auth/routes";
import { getServerSession } from "@/lib/shared/auth/server-session";

export default async function Home() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  redirect(getBackendRoleHomePath(session.tipoUsuario));
}
