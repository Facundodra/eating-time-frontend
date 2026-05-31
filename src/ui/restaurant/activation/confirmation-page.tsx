"use client";

import {
  ArrowRightIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
  KeyIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";

import { confirmRestaurantAccountAction } from "@/app/register/restaurant/confirmation/actions";
import EatingTimeLogo from "@/ui/shared/images/logo.png";
import ThemeToggle from "@/ui/shared/theme/theme-toggle";

type Props = Readonly<{
  initialEmail?: string;
  initialCode?: string;
}>;

const inputClassName =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20 dark:disabled:bg-slate-900 dark:disabled:text-slate-500";

export default function ConfirmationPage({
  initialEmail = "",
  initialCode = "",
}: Props) {
  const [state, formAction, pending] = useActionState(
    confirmRestaurantAccountAction,
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isSuccess = state?.success === true;
  const isAlreadyConfirmed = state?.alreadyConfirmed === true;
  const isDone = isSuccess || isAlreadyConfirmed;
  const fieldsDisabled = pending || isDone;
  const hasLinkData = Boolean(initialCode);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6 sm:py-8">
      <section className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src={EatingTimeLogo}
              alt="Eating Time"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl shadow-sm"
              priority
            />
            <div>
              <p className="text-sm font-extrabold">Eating Time</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confirmación de local
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-full bg-white px-4 text-xs font-extrabold text-orange-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-orange-50 dark:bg-slate-900 dark:ring-slate-800 dark:hover:bg-slate-800"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </header>

        <section className="overflow-hidden rounded-3xl border border-orange-200 bg-orange-600 p-6 text-white shadow-sm dark:border-orange-500/20 sm:p-8">
          <div className="flex max-w-3xl flex-col gap-5 sm:flex-row sm:items-start">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15">
              <BuildingStorefrontIcon className="h-7 w-7" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-100">
                Solicitud aprobada
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                Confirmá la cuenta de tu local
              </h1>
              <p className="mt-3 text-sm font-medium leading-6 text-orange-50">
                Tu solicitud fue aceptada por un administrador. Usá el código
                recibido y creá la contraseña definitiva para entrar al panel
                del local.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <form
            action={formAction}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-6">
              <h2 className="text-lg font-black">Finalizar confirmación</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                El código identifica la solicitud aprobada y solo puede usarse una vez.
              </p>
            </div>

            {!hasLinkData ? (
              <div className="mb-5 flex gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-100">
                <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-orange-600 dark:text-orange-300" />
                <p>
                  Si abriste el enlace desde el correo, el código debería venir
                  completo. También podés ingresarlo manualmente.
                </p>
              </div>
            ) : null}

            <div className="space-y-4">
              {initialEmail ? (
                <input type="hidden" name="email" value={initialEmail} />
              ) : null}

              <Field
                label="Código de confirmación"
                htmlFor="codigo"
                helper="Pegá el código recibido en el correo de aprobación."
              >
                <input
                  id="codigo"
                  name="codigo"
                  type="text"
                  autoComplete="one-time-code"
                  defaultValue={initialCode}
                  disabled={fieldsDisabled}
                  placeholder="Código de confirmación"
                  required
                  className={`${inputClassName} font-mono text-xs tracking-wide`}
                />
              </Field>

              <PasswordInput
                id="password"
                name="password"
                label="Contraseña"
                visible={showPassword}
                disabled={fieldsDisabled}
                onToggle={() => setShowPassword((value) => !value)}
              />

              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                label="Confirmar contraseña"
                visible={showConfirmPassword}
                disabled={fieldsDisabled}
                onToggle={() => setShowConfirmPassword((value) => !value)}
              />
            </div>

            {state?.error ? (
              <div
                id="activation-error"
                className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
              >
                {state.error}
              </div>
            ) : null}

            {isAlreadyConfirmed ? (
              <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                <InformationCircleIcon className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
                <div>
                  <p className="font-black">Esta cuenta ya fue confirmada.</p>
                  <p className="mt-1 leading-5">
                    Podés iniciar sesión con la contraseña configurada anteriormente.
                  </p>
                </div>
              </div>
            ) : null}

            {isSuccess ? (
              <div className="mt-5 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
                <div>
                  <p className="font-black">Cuenta confirmada correctamente.</p>
                  <p className="mt-1 leading-5">
                    Ya podés iniciar sesión con la contraseña que acabás de crear.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-extrabold text-orange-600 transition hover:bg-orange-50 dark:hover:bg-orange-500/10"
              >
                Volver al login
              </Link>

              {isDone ? (
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-700"
                >
                  Iniciar sesión
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? "Confirmando..." : "Confirmar cuenta"}
                </button>
              )}
            </div>
          </form>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-black">Estado de la solicitud</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              La aprobación ya fue realizada por el administrador.
            </p>

            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="flex gap-3">
                <CheckCircleIcon className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                    Solicitud aprobada
                  </p>
                  <p className="mt-1 text-xs leading-5 text-emerald-700/80 dark:text-emerald-200/80">
                    Solo falta definir la contraseña para confirmar la cuenta y
                    usar el panel del local.
                  </p>
                </div>
              </div>
            </div>

            <ol className="mt-5 space-y-3">
              <Step
                number="1"
                status="done"
                title="Solicitud aprobada"
                description="El administrador verificó y aprobó el registro del local."
              />
              <Step
                number="2"
                status="done"
                title="Código enviado"
                description="Usá el código recibido para confirmar la cuenta."
              />
              <Step
                number="3"
                status={isDone ? "done" : "current"}
                title="Cuenta confirmada"
                description="Creá una contraseña y habilitá el acceso al sistema."
              />
            </ol>

            <div className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <div className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                <ShieldCheckIcon className="h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />
                <span>El código solo puede usarse una vez.</span>
              </div>
              <div className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                <KeyIcon className="h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />
                <span>
                  La contraseña debe tener al menos 8 caracteres y será la que
                  uses para entrar al panel.
                </span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  helper,
  children,
}: Readonly<{
  label: string;
  htmlFor: string;
  helper?: string;
  children: ReactNode;
}>) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200"
      >
        {label}
      </label>
      {children}
      {helper ? (
        <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function PasswordInput({
  id,
  name,
  label,
  visible,
  disabled,
  onToggle,
}: Readonly<{
  id: string;
  name: string;
  label: string;
  visible: boolean;
  disabled: boolean;
  onToggle: () => void;
}>) {
  const toggleLabel = visible ? "Ocultar contraseña" : "Mostrar contraseña";

  return (
    <Field label={label} htmlFor={id} helper="Mínimo 8 caracteres.">
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          minLength={8}
          disabled={disabled}
          placeholder="********"
          required
          className={`${inputClassName} pr-11`}
        />
        <button
          type="button"
          aria-label={toggleLabel}
          title={toggleLabel}
          disabled={disabled}
          onClick={onToggle}
          className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          {visible ? (
            <EyeSlashIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      </div>
    </Field>
  );
}

function Step({
  number,
  status,
  title,
  description,
}: Readonly<{
  number: string;
  status: "done" | "current";
  title: string;
  description: string;
}>) {
  const isDone = status === "done";

  return (
    <li className="flex gap-3">
      <span
        className={
          isDone
            ? "grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
            : "grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-100 text-xs font-black text-orange-700 dark:bg-orange-500/10 dark:text-orange-300"
        }
      >
        {isDone ? <CheckCircleIcon className="h-4 w-4" /> : number}
      </span>
      <div>
        <p className="text-sm font-black text-slate-900 dark:text-white">
          {title}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
    </li>
  );
}
