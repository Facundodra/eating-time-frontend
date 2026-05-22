import { redirect } from "next/navigation";

import { getRoleHomePath } from "@/lib/auth/routes";
import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  redirect(getRoleHomePath(session.user.role));
}
