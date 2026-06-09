"use client";

import {
  ArrowRightIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
  KeyIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";

import {
  confirmRestaurantAccount,
  RestaurantConfirmationError,
} from "@/services/shared/auth-service";
import EatingTimeLogo from "@/ui/shared/images/logo.png";
import ThemeToggle from "@/ui/shared/theme/theme-toggle";

type Props = Readonly<{
  initialEmail?: string;
  initialCode?: string;
}>;

const inputClassName =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20 dark:disabled:bg-slate-900 dark:disabled:text-slate-500";

type ConfirmationState =
  | { error: string; success?: never; alreadyConfirmed?: never }
  | { success: true; error?: never; alreadyConfirmed?: never }
  | { alreadyConfirmed: true; error?: never; success?: never }
  | null;

export default function ConfirmationPage({
  initialEmail = "",
  initialCode = "",
}: Props) {
  const [state, setState] = useState<ConfirmationState>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isSuccess = state?.success === true;
  const isAlreadyConfirmed = state?.alreadyConfirmed === true;
  const isDone = isSuccess || isAlreadyConfirmed;
  const fieldsDisabled = pending || isDone;
  const hasLinkData = Boolean(initialCode);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const codigo = String(
      formData.get("codigo") ?? formData.get("code") ?? "",
    ).trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!codigo) {
      setState({ error: "El código de confirmación es obligatorio." });
      return;
    }

    if (!password) {
      setState({ error: "La contraseña es obligatoria." });
      return;
    }

    if (password.length < 8) {
      setState({ error: "La contraseña debe tener al menos 8 caracteres." });
      return;
    }

    if (password !== confirmPassword) {
      setState({ error: "Las contraseñas no coinciden." });
      return;
    }

    setPending(true);
    setState(null);

    try {
      await confirmRestaurantAccount({
        ...(email ? { email } : {}),
        codigo,
        password,
      });

      setState({ success: true });
    } catch (error) {
      console.error("Error confirmando cuenta local:", error);

      if (error instanceof RestaurantConfirmationError && error.status === 409) {
        setState({ alreadyConfirmed: true });
        return;
      }

      setState({
        error:
          error instanceof RestaurantConfirmationError
            ? error.message
            : "No se pudo confirmar la cuenta. Intentalo nuevamente.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f7] px-4 py-6 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-8">
      <section>
        <header className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4">
          <Link href="/login" className="flex items-center gap-3">
            <Image
              src={EatingTimeLogo}
              alt="Eating Time"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl shadow-sm"
              priority
            />
            <div>
              <span className="block text-lg font-black leading-5 text-slate-900 dark:text-white">
                Eating<span className="text-red-600 dark:text-red-500">Time</span>
              </span>
              <span className="text-xs font-bold text-slate-400">
                Confirmación de local
              </span>
            </div>
          </Link>

          <ThemeToggle />
        </header>

        <section className="mx-auto mt-8 w-full max-w-[800px] rounded-[24px] bg-gradient-to-br from-orange-600 to-orange-400 px-6 py-7 text-white shadow-[0_24px_70px_rgba(234,88,12,0.24)] sm:px-8 lg:max-w-[1100px]">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            Confirmá la cuenta de tu local
          </h1>
          <p className="mt-3 max-w-[720px] text-sm font-semibold leading-6 text-white/90">
            Tu solicitud fue aceptada por un administrador. Usá el código
            recibido y creá la contraseña definitiva para entrar al panel del
            local.
          </p>
        </section>

        <div className="mx-auto mt-6 grid w-full max-w-[800px] gap-5 lg:max-w-[1100px] lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="border-b border-gray-100 px-5 py-5 dark:border-slate-800 sm:px-6">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Finalizar confirmación
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                El código identifica la solicitud aprobada y solo puede usarse
                una vez.
              </p>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-6">
              {!hasLinkData ? (
                <div className="flex gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-100">
                  <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-orange-600 dark:text-orange-300" />
                  <p>
                    Si abriste el enlace desde el correo, el código debería
                    venir completo. También podés ingresarlo manualmente.
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
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
                >
                  {state.error}
                </div>
              ) : null}

              {isAlreadyConfirmed ? (
                <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  <InformationCircleIcon className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
                  <div>
                    <p className="font-black">Esta cuenta ya fue confirmada.</p>
                    <p className="mt-1 leading-5">
                      Podés iniciar sesión con la contraseña configurada
                      anteriormente.
                    </p>
                  </div>
                </div>
              ) : null}

              {isSuccess ? (
                <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                  <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
                  <div>
                    <p className="font-black">Cuenta confirmada correctamente.</p>
                    <p className="mt-1 leading-5">
                      Ya podés iniciar sesión con la contraseña que acabás de
                      crear.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
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
            </div>
          </form>

          <aside className="h-fit overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-gray-100 px-6 py-5 dark:border-slate-800">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Proceso de habilitación
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                La aprobación ya fue realizada por el administrador.
              </p>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-2xl border border-gray-100 p-4 dark:border-slate-800">
                <ol className="space-y-4">
                  <Step
                    number="1"
                    status="done"
                    title="Ingresar datos"
                    description="Se completan los datos básicos del local y sus imágenes."
                  />
                  <Step
                    number="2"
                    status="done"
                    title="Solicitar aprobación"
                    description="El sistema envía la solicitud para que el local sea evaluado."
                  />
                  <Step
                    number="3"
                    status="done"
                    title="Revisión del administrador"
                    description="Un administrador analiza la información ingresada."
                  />
                  <Step
                    number="4"
                    status="done"
                    title="Notificación vía email"
                    description="Te avisamos si la solicitud fue aprobada o rechazada."
                  />
                  <Step
                    number="5"
                    status={isDone ? "done" : "current"}
                    title="Acceso al sistema"
                    description="El local establece su contraseña, inicia sesión y comienza a operar."
                  />
                </ol>
              </div>

              <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
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
          className="absolute top-1/2 right-3 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
            ? "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
            : "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-50 text-sm font-black text-orange-600 dark:bg-orange-500/10 dark:text-orange-300"
        }
      >
        {isDone ? <CheckCircleIcon className="h-4 w-4" /> : number}
      </span>
      <div>
        <p className="text-sm font-black text-slate-800 dark:text-slate-100">
          {title}
        </p>
        <p className="mt-0.5 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
    </li>
  );
}
