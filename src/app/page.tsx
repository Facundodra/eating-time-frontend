import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getBackendRoleHomePath } from "@/lib/auth/routes";
import { FRONTEND_SESSION_ROLE_COOKIE_NAME } from "@/lib/auth/session-cookies";
import type { BackendUserRole } from "@/lib/auth/types";

export default async function Home() {
  const cookieStore = await cookies();
  const role = cookieStore.get(FRONTEND_SESSION_ROLE_COOKIE_NAME)?.value as
    | BackendUserRole
    | undefined;

  if (!role) {
    redirect("/login");
  }

  redirect(getBackendRoleHomePath(role));
}
