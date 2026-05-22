import Link from "next/link";

import { loginAction } from "@/app/login/actions";

export default function LoginForm() {
  return (
    <section className="w-full max-w-[420px] rounded-[28px] border border-gray-200 bg-white px-9 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">
          Iniciar sesión
        </h1>
        <p className="mt-3 max-w-[310px] text-sm leading-6 font-medium text-slate-400">
          Accedé a tu cuenta para continuar utilizando Eating Time.
        </p>
      </div>

      <form action={loginAction} className="mt-8 space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-xs font-bold text-slate-600"
          >
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nombre@email.com"
            className="h-12 w-full rounded-2xl border border-gray-200 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="password"
              className="block text-xs font-bold text-slate-600"
            >
              Contraseña
            </label>
            <Link
              href="/recover-password"
              className="text-xs font-extrabold text-orange-600 transition hover:text-orange-700"
            >
              Recuperar contraseña
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Ingresá tu contraseña"
            className="h-12 w-full rounded-2xl border border-gray-200 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          />
        </div>

        <button
          type="submit"
          className="h-[52px] w-full cursor-pointer rounded-2xl bg-orange-600 text-sm font-extrabold text-white shadow-[0_12px_22px_rgba(234,88,12,0.22)] transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100"
        >
          Ingresar
        </button>
      </form>

      <div className="my-8 h-px bg-gray-200" />

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">
              ¿No tenés cuenta?
            </h2>
            <p className="mt-1 max-w-[190px] text-xs leading-5 font-medium text-slate-400">
              Creá una cuenta cliente para comenzar a realizar pedidos.
            </p>
          </div>
          <Link
            href="/register"
            className="shrink-0 text-sm font-extrabold text-orange-600 transition hover:text-orange-700"
          >
            Crear cuenta
          </Link>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4">
          <div>
            <h2 className="max-w-[150px] text-sm leading-5 font-extrabold text-slate-900">
              ¿Tenés un local gastronómico?
            </h2>
            <p className="mt-1 max-w-[190px] text-xs leading-5 font-medium text-orange-900/55">
              Enviá una solicitud de registro para ofrecer tus productos dentro
              de la plataforma.
            </p>
          </div>
          <Link
            href="/restaurant/register"
            className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-orange-600 px-4 text-xs font-extrabold text-white transition hover:bg-orange-700"
          >
            Registrar mi local
          </Link>
        </div>
      </div>
    </section>
  );
}
