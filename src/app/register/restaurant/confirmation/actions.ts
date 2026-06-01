"use server";

import {
  confirmRestaurantAccount,
  RestaurantConfirmationError,
} from "@/services/shared/auth-service";

export type RestaurantConfirmationState =
  | { error: string; success?: never; alreadyConfirmed?: never }
  | { success: true; error?: never; alreadyConfirmed?: never }
  | { alreadyConfirmed: true; error?: never; success?: never }
  | null;

export async function confirmRestaurantAccountAction(
  _prev: RestaurantConfirmationState,
  formData: FormData,
): Promise<RestaurantConfirmationState> {
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
    await confirmRestaurantAccount({
      ...(email ? { email } : {}),
      codigo,
      password,
    });

    return { success: true };
  } catch (error) {
    console.error("Error confirmando cuenta local:", error);

    if (error instanceof RestaurantConfirmationError && error.status === 409) {
      return { alreadyConfirmed: true };
    }

    return {
      error:
        error instanceof RestaurantConfirmationError
          ? error.message
          : "No se pudo confirmar la cuenta. Intentalo nuevamente.",
    };
  }
}
