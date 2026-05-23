"use server";

import { register } from "@/services/auth-service";

type RegisterState = { error: string } | { success: true } | null;

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden" };
  }

  try {
    await register({
      name: String(formData.get("name") ?? "").trim(),
      document: String(formData.get("document") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      password,
      profile_pic: (formData.get("profile_pic") as File | null) ?? "",
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al registrar" };
  }

  return { success: true };
}
