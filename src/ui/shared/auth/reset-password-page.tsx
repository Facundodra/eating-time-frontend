"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

import {
  confirmPasswordReset,
  PasswordResetError,
} from "@/services/shared/auth-service";
import LoadingButton from "@/ui/shared/buttons/loading-button";
import EatingTimeLogo from "@/ui/shared/images/logo.png";
import ThemeToggle from "@/ui/shared/theme/theme-toggle";

type Props = { token: string };

export default function ResetPasswordPage({ token }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPsw, setShowPsw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <PageShell>
        <div className="flex flex-col items-center text-center py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15 mb-5">
            <svg className="h-7 w-7 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Enlace no válido
          </h2>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-400">
            El enlace que usaste no es válido. Solicitá uno nuevo desde la página de recuperación.
          </p>
          <Link
            href="/forgot-password"
            className="mt-7 text-sm font-extrabold text-orange-600 transition hover:text-orange-700"
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      </PageShell>
    );
  }

  function handleContinue() {
    window.location.href = "eatingtime://auth/login";
    setTimeout(() => { window.location.href = "/login"; }, 1500);
  }

  if (done) {
    return (
      <PageShell>
        <div className="flex flex-col items-center text-center py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/15 mb-5">
            <svg className="h-7 w-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            ¡Contraseña actualizada!
          </h2>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-400">
            Tu contraseña fue restablecida correctamente. Ya podés iniciar sesión.
          </p>
          <button
            onClick={handleContinue}
            className="mt-7 h-[48px] px-8 cursor-pointer rounded-2xl bg-orange-600 text-sm font-extrabold text-white shadow-[0_12px_22px_rgba(234,88,12,0.22)] transition hover:bg-orange-700"
          >
            Continuar
          </button>
        </div>
      </PageShell>
    );
  }

  async function handleSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nueva = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm_password") ?? "");

    if (nueva !== confirm) {
      setConfirmError("Las contraseñas no coinciden");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      await confirmPasswordReset(token, nueva);
      setDone(true);
    } catch (err) {
      if (err instanceof PasswordResetError && err.code === "expired") {
        setErrorMessage(err.message);
      } else if (err instanceof PasswordResetError && err.code === "invalid") {
        setErrorMessage(err.message);
      } else if (err instanceof PasswordResetError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("No se pudo restablecer la contraseña. Intentalo nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell>
      <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900 dark:text-white">
        Nueva contraseña
      </h1>
      <p className="mt-3 text-sm font-medium leading-6 text-slate-400 dark:text-slate-400">
        Elegí una contraseña nueva para tu cuenta.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        <div className="relative">
          <label htmlFor="password" className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
            Nueva contraseña
          </label>
          <input
            id="password"
            name="password"
            type={showPsw ? "text" : "password"}
            autoComplete="new-password"
            required
            className="field pr-[40px]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPsw((v) => !v)}
            className="absolute bottom-[13px] right-[14px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            {showPsw ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative">
          <label htmlFor="confirm_password" className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
            Confirmar contraseña
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            required
            placeholder="Repetí la contraseña"
            className={`field pr-[40px] ${confirmError ? "!border-red-400" : ""}`}
            onChange={(e) => {
              if (e.target.value && e.target.value !== password) {
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
            <p className="mt-2 text-xs font-medium text-red-500">{confirmError}</p>
          )}
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              {errorMessage}
            </p>
            {errorMessage.includes("expiró") && (
              <Link
                href="/forgot-password"
                className="mt-1 block text-xs font-extrabold text-red-700 underline dark:text-red-300"
              >
                Solicitar nuevo enlace
              </Link>
            )}
          </div>
        )}

        <LoadingButton
          type="submit"
          isLoading={isSubmitting}
          loadingText="Guardando..."
          disabled={!!confirmError}
          className="h-[52px] w-full cursor-pointer rounded-2xl bg-orange-600 text-sm font-extrabold text-white shadow-[0_12px_22px_rgba(234,88,12,0.22)] transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Guardar contraseña
        </LoadingButton>
      </form>

      <div className="my-7 h-px bg-gray-200 dark:bg-slate-800" />

      <p className="text-center text-sm text-slate-400 dark:text-slate-400">
        ¿Recordaste tu contraseña?{" "}
        <Link href="/login" className="font-extrabold text-orange-600 transition hover:text-orange-700">
          Iniciá sesión
        </Link>
      </p>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.JSX.Element | React.JSX.Element[] }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#fbf8f5] px-4 py-12 dark:bg-slate-950">
      <div className="fixed right-6 top-6 z-10">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[420px] rounded-[28px] border border-gray-200 bg-white px-9 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900">
        <Link href="/" className="flex w-fit items-center gap-3 mb-8">
          <Image src={EatingTimeLogo} alt="Eating Time" width={36} height={36} className="h-9 w-9 rounded-xl shadow-sm" />
          <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
            Eating Time
          </span>
        </Link>
        {children}
      </div>
    </main>
  );
}
