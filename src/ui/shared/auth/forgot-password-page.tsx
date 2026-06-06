"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { resetPassword } from "@/services/shared/auth-service";
import LoadingButton from "@/ui/shared/buttons/loading-button";
import EatingTimeLogo from "@/ui/shared/images/logo.png";
import ThemeToggle from "@/ui/shared/theme/theme-toggle";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    setIsSubmitting(true);
    try {
      await resetPassword(email);
    } catch {
      // siempre mostramos éxito por seguridad
    } finally {
      setIsSubmitting(false);
      setSent(true);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#fbf8f5] px-4 py-12 dark:bg-slate-950">
      <div className="fixed right-6 top-6 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[420px] rounded-[28px] border border-gray-200 bg-white px-9 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900">
        <Link href="/" className="flex w-fit items-center gap-3 mb-8">
          <Image
            src={EatingTimeLogo}
            alt="Eating Time"
            width={36}
            height={36}
            className="h-9 w-9 rounded-xl shadow-sm"
          />
          <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
            Eating<span className="text-red-600 dark:text-red-500">Time</span>
          </span>
        </Link>

        {sent ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/15 mb-5">
              <svg className="h-7 w-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Revisá tu correo
            </h2>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-400 dark:text-slate-400">
              Si tu email está registrado, recibirás un correo con instrucciones para restablecer tu contraseña.
            </p>
            <Link
              href="/login"
              className="mt-7 text-sm font-extrabold text-orange-600 transition hover:text-orange-700"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900 dark:text-white">
              Recuperar contraseña
            </h1>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-400 dark:text-slate-400">
              Ingresá tu email y te enviaremos un link para que puedas crear una nueva contraseña.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="nombre@email.com"
                  className="field"
                />
              </div>

              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                loadingText="Enviando..."
                className="h-[52px] w-full cursor-pointer rounded-2xl bg-orange-600 text-sm font-extrabold text-white shadow-[0_12px_22px_rgba(234,88,12,0.22)] transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100"
              >
                Enviar instrucciones
              </LoadingButton>
            </form>

            <div className="my-7 h-px bg-gray-200 dark:bg-slate-800" />

            <p className="text-center text-sm text-slate-400 dark:text-slate-400">
              ¿Recordaste tu contraseña?{" "}
              <Link href="/login" className="font-extrabold text-orange-600 transition hover:text-orange-700">
                Iniciá sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
