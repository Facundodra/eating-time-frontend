"use client";

import {
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import {
  changePassword,
  ChangePasswordError,
} from "@/services/shared/auth-service";
import LoadingButton from "@/ui/shared/buttons/loading-button";

export default function RestaurantChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const hasFormChanges =
    currentPassword.length > 0 ||
    newPassword.length > 0 ||
    confirmPassword.length > 0;

  function clearForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setConfirmError("");
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleConfirmPasswordChange(value: string) {
    setConfirmPassword(value);

    if (value && value !== newPassword) {
      setConfirmError("Las contrasenas no coinciden.");
      return;
    }

    setConfirmError("");
  }

  function handleNewPasswordChange(value: string) {
    setNewPassword(value);

    if (confirmPassword && confirmPassword !== value) {
      setConfirmError("Las contrasenas no coinciden.");
      return;
    }

    setConfirmError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setConfirmError("Las contrasenas no coinciden.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setConfirmError("");
      setSuccessMessage("La contrasena se actualizo correctamente.");
    } catch (error) {
      if (error instanceof ChangePasswordError && error.code === "unauthorized") {
        router.replace("/login");
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar la contrasena. Intentalo nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                <LockClosedIcon className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-lg font-extrabold text-slate-950 dark:text-white">
                  Cambiar contrasena
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Ingresa la contrasena actual y defini una nueva para el acceso
                  del local.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 px-5 py-5">
            <PasswordField
              id="current_password"
              label="Contrasena actual"
              value={currentPassword}
              visible={showCurrent}
              autoComplete="current-password"
              onChange={setCurrentPassword}
              onToggleVisibility={() => setShowCurrent((current) => !current)}
              disabled={isSubmitting}
            />

            <PasswordField
              id="new_password"
              label="Nueva contrasena"
              value={newPassword}
              visible={showNew}
              autoComplete="new-password"
              minLength={8}
              onChange={handleNewPasswordChange}
              onToggleVisibility={() => setShowNew((current) => !current)}
              disabled={isSubmitting}
            />

            <div>
              <PasswordField
                id="confirm_password"
                label="Confirmar nueva contrasena"
                value={confirmPassword}
                visible={showConfirm}
                autoComplete="new-password"
                hasError={Boolean(confirmError)}
                onChange={handleConfirmPasswordChange}
                onToggleVisibility={() => setShowConfirm((current) => !current)}
                disabled={isSubmitting}
              />
              {confirmError ? (
                <p className="mt-2 text-xs font-bold text-red-500">
                  {confirmError}
                </p>
              ) : null}
            </div>

            {successMessage ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircleIcon className="h-5 w-5" />
                {successMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
              {hasFormChanges ? (
                <button
                  type="button"
                  onClick={clearForm}
                  disabled={isSubmitting}
                  className="h-11 cursor-pointer rounded-xl bg-slate-100 px-5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
              ) : null}
              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                loadingText="Guardando..."
                disabled={Boolean(confirmError)}
                className="h-11 w-full rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-orange-500/20 sm:w-fit"
              >
                Guardar contrasena
              </LoadingButton>
            </div>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                <ShieldCheckIcon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-950 dark:text-white">
                  Seguridad del local
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Usa una contrasena de al menos 8 caracteres y evita repetir
                  credenciales de otros servicios.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                <UserIcon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-950 dark:text-white">
                  Datos del local
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Accede a la pantalla de datos para editar el nombre, telefono
                  o foto del local.
                </p>
              </div>
            </div>
            <Link
              href="/restaurant/my-data"
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-700 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
            >
              Ir a datos del local
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  autoComplete: string;
  disabled: boolean;
  hasError?: boolean;
  minLength?: number;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
};

function PasswordField({
  id,
  label,
  value,
  visible,
  autoComplete,
  disabled,
  hasError = false,
  minLength,
  onChange,
  onToggleVisibility,
}: PasswordFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <span className="relative block">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          minLength={minLength}
          disabled={disabled}
          required
          className={`h-11 w-full rounded-xl border bg-white px-4 pr-12 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 ${
            hasError
              ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-red-500/50 dark:focus:ring-red-500/20"
              : "border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:focus:ring-orange-500/20"
          }`}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={disabled}
          aria-label={visible ? "Ocultar contrasena" : "Mostrar contrasena"}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          {visible ? (
            <EyeSlashIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      </span>
    </label>
  );
}
