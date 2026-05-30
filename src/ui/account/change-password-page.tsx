"use client";

import { KeyIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { changePassword } from "@/services/account-service";
import LoadingButton from "@/ui/shared/buttons/loading-button";

type ChangePasswordPageProps = {
  backHref: string;
};

export default function ChangePasswordPage({ backHref }: ChangePasswordPageProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    setMessage("");
    setErrorMessage("");

    if (newPassword.length < 8) {
      setErrorMessage("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setIsSaving(true);

    try {
      await changePassword({ currentPassword, newPassword });
      form.reset();
      setMessage("La contraseña se actualizó correctamente.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar la contraseña.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="border-b border-slate-100 pb-5 dark:border-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
            <KeyIcon className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-950 dark:text-white">
            Cambiar contraseña
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Ingresá tu contraseña actual y elegí una nueva para mantener segura
            tu cuenta.
          </p>
        </div>

        {errorMessage ? (
          <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {errorMessage}
          </p>
        ) : null}

        {message ? (
          <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            {message}
          </p>
        ) : null}

        <div className="mt-6 grid gap-5">
          <PasswordField
            label="Contraseña actual"
            name="currentPassword"
            autoComplete="current-password"
          />
          <PasswordField
            label="Nueva contraseña"
            name="newPassword"
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirmar nueva contraseña"
            name="confirmPassword"
            autoComplete="new-password"
          />
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <Link
            href={backHref}
            className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-bold text-orange-600 transition hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-500/10"
          >
            Volver a mis datos
          </Link>
          <LoadingButton
            type="submit"
            isLoading={isSaving}
            loadingText="Actualizando..."
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-orange-600 px-5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Actualizar contraseña
          </LoadingButton>
        </div>
      </form>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
          <ShieldCheckIcon className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-base font-bold text-slate-950 dark:text-white">
          Recomendaciones
        </h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          <li>Usá al menos 8 caracteres.</li>
          <li>Evitá repetir contraseñas de otros servicios.</li>
          <li>No compartas tu contraseña con otras personas.</li>
        </ul>
      </aside>
    </section>
  );
}

function PasswordField({
  autoComplete,
  label,
  name,
}: {
  autoComplete: string;
  label: string;
  name: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <input
        name={name}
        type="password"
        autoComplete={autoComplete}
        required
        className="field"
      />
    </label>
  );
}
