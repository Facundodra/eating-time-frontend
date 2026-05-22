"use server";

import { redirect } from "next/navigation";

import { getRoleHomePath } from "@/lib/auth/routes";
import { createSession } from "@/lib/auth/session";
import { login } from "@/services/auth-service";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const user = await login({ email, password });

  await createSession(user);
  redirect(getRoleHomePath(user.role));
}
