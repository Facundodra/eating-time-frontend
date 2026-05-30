"use server";

import {
  confirmLocalAccount,
  LocalConfirmationError,
} from "@/services/auth-service";

export type LocalConfirmationState =
  | { error: string; success?: never; alreadyConfirmed?: never }
  | { success: true; error?: never; alreadyConfirmed?: never }
  | { alreadyConfirmed: true; error?: never; success?: never }
  | null;

export async function confirmLocalAccountAction(
  _prev: LocalConfirmationState,
  formData: FormData,
): Promise<LocalConfirmationState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const codigo = String(
    formData.get("codigo") ?? formData.get("code") ?? "",
  ).trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!codigo) {
    return { error: "El código de confirmación es obligatorio." };
  }

  if (!password) {
    return { error: "La contraseña es obligatoria." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  try {
    await confirmLocalAccount({
      ...(email ? { email } : {}),
      codigo,
      password,
    });

    return { success: true };
  } catch (error) {
    console.error("Error confirmando cuenta local:", error);

    if (error instanceof LocalConfirmationError && error.status === 409) {
      return { alreadyConfirmed: true };
    }

    return {
      error:
        error instanceof LocalConfirmationError
          ? error.message
          : "No se pudo confirmar la cuenta. Intentalo nuevamente.",
    };
  }
}
