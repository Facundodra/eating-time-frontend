"use server";

import {
  confirmarCuentaLocal,
  CuentaLocalYaConfirmadaError,
} from "@/services/gestion-service";

export type ConfirmLocalState =
  | { error: string }
  | { success: true }
  | { alreadyConfirmed: true }
  | null;

export async function confirmLocalAccountAction(
  _prev: ConfirmLocalState,
  formData: FormData,
): Promise<ConfirmLocalState> {
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
    await confirmarCuentaLocal({
      codigo,
      password,
    });

    return { success: true };
  } catch (err) {
    if (err instanceof CuentaLocalYaConfirmadaError) {
      return { alreadyConfirmed: true };
    }

    return {
      error:
        err instanceof Error
          ? err.message
          : "No se pudo confirmar la cuenta.",
    };
  }
}
