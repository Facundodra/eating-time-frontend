"use client";

import { useState } from "react";
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

import {
  changePassword,
  ChangePasswordError,
} from "@/services/shared/auth-service";
import LoadingButton from "@/ui/shared/buttons/loading-button";

type Props = { backHref: string };

export default function ChangePasswordPage({ backHref }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const current = String(formData.get("current_password") ?? "");
    const nueva = String(formData.get("new_password") ?? "");
    const confirm = String(formData.get("confirm_password") ?? "");

    if (nueva !== confirm) {
      setConfirmError("Las contraseñas no coinciden");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      await changePassword(current, nueva);
      setDone(true);
    } catch (err) {
      if (err instanceof ChangePasswordError && err.code === "unauthorized") {
        router.replace("/login");
        return;
      }
      if (err instanceof ChangePasswordError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("No se pudo cambiar la contraseña. Intentalo nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-6 max-w-lg">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-gray-100 px-5 py-5 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                <LockClosedIcon className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nueva contraseña</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Ingresá tu contraseña actual y elegí una nueva.
                </p>
              </div>
            </div>
          </div>

          {done ? (
            <div className="flex flex-col items-center text-center px-5 py-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mb-5 dark:bg-emerald-500/10">
                <svg className="h-7 w-7 text-green-600 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                ¡Contraseña actualizada!
              </h2>
              <p className="mt-3 text-sm font-medium text-gray-500 leading-6 dark:text-slate-400">
                Tu contraseña fue cambiada correctamente.
              </p>
              <button
                onClick={() => router.push(backHref)}
                className="mt-7 h-[44px] px-8 cursor-pointer rounded-2xl bg-orange-600 text-sm font-extrabold text-white shadow-[0_8px_16px_rgba(234,88,12,0.18)] transition hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
              >
                Volver a mi cuenta
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
              <div className="relative">
                <label htmlFor="current_password" className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Contraseña actual
                </label>
                <input
                  id="current_password"
                  name="current_password"
                  type={showCurrent ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="field pr-[40px]"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute bottom-[13px] right-[14px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showCurrent ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <label htmlFor="new_password" className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Nueva contraseña
                </label>
                <input
                  id="new_password"
                  name="new_password"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="field pr-[40px]"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute bottom-[13px] right-[14px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNew ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <label htmlFor="confirm_password" className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Confirmar nueva contraseña
                </label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="Repetí la nueva contraseña"
                  className={`field pr-[40px] ${confirmError ? "!border-red-400" : ""}`}
                  onChange={(e) => {
                    if (e.target.value && e.target.value !== newPassword) {
                      setConfirmError("Las contraseñas no coinciden");
                    } else {
                      setConfirmError("");
                    }
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute bottom-[13px] right-[14px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
                {confirmError && (
                  <p className="mt-2 text-xs font-medium text-red-500 dark:text-red-300">{confirmError}</p>
                )}
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">{errorMessage}</p>
                </div>
              )}

              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                loadingText="Guardando..."
                disabled={!!confirmError}
                className="h-[48px] w-full cursor-pointer rounded-2xl bg-orange-600 text-sm font-extrabold text-white shadow-[0_8px_16px_rgba(234,88,12,0.18)] transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-orange-500 dark:hover:bg-orange-600 dark:focus:ring-orange-500/20"
              >
                Guardar contraseña
              </LoadingButton>
            </form>
          )}
        </div>
      </section>
  );
}
