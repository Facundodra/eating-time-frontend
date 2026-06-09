import Image from "next/image";
import Link from "next/link";

import EatingTimeLogo from "@/ui/shared/images/logo.png";
import ThemeToggle from "@/ui/shared/theme/theme-toggle";

import RegisterForm from "./register-form";

const habilitationSteps = [
  {
    title: "Ingresar datos",
    description: "Se completan los datos básicos del local y sus imágenes.",
  },
  {
    title: "Solicitar aprobación",
    description: "El sistema envía la solicitud para que el local sea evaluado.",
  },
  {
    title: "Revisión del administrador",
    description: "Un administrador analiza la información ingresada.",
  },
  {
    title: "Notificación vía email",
    description: "Te avisamos si la solicitud fue aprobada o rechazada.",
  },
  {
    title: "Acceso al sistema",
    description:
      "Si se aprueba, el local establece su contraseña, inicia sesión y comienza a operar.",
  },
];

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f7] px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-8">
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
              Eating Time
            </span>
            <span className="text-xs font-bold text-slate-400">
              Registro de locales
            </span>
          </div>
        </Link>

        <ThemeToggle />
      </header>

      <section className="mx-auto mt-8 w-full max-w-[800px] rounded-[24px] bg-gradient-to-br from-orange-600 to-orange-400 px-6 py-7 text-white shadow-[0_24px_70px_rgba(234,88,12,0.24)] sm:px-8 lg:max-w-[1100px]">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          Solicitá la apertura de tu local
        </h1>
        <p className="mt-3 max-w-[720px] text-sm font-semibold leading-6 text-white/90">
          Completá la información principal del local, agregá imágenes de
          referencia y solicitá la aprobación. La cuenta recién quedará creada y
          habilitada cuando un administrador revise y apruebe la solicitud.
        </p>
      </section>

      <div className="mx-auto mt-6 grid w-full max-w-[800px] gap-5 lg:max-w-[1100px] lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <RegisterForm />

        <aside className="h-fit overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-gray-100 px-6 py-5 dark:border-slate-800">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Proceso de habilitación
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              La cuenta queda bloqueada hasta la revisión administrativa.
            </p>
          </div>

          <div className="space-y-4 p-5">
            <div className="rounded-2xl bg-orange-50 px-4 py-4 text-sm text-orange-900 dark:bg-orange-500/10 dark:text-orange-100">
              <p className="font-black">Acceso restringido</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-orange-800/80 dark:text-orange-100/80">
                El local no podrá iniciar sesión ni utilizar funciones del
                sistema hasta ser aprobado por un administrador.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4 dark:border-slate-800">
              <ol className="space-y-4">
                {habilitationSteps.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-black text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
