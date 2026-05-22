"use client";

import { ArrowLeftIcon, HomeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/10">
          <span className="text-2xl font-bold">404</span>
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          Pagina no encontrada
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Esta seccion todavia no esta implementada o la direccion no existe.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-orange-500/10"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver atras
          </button>
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
            href="/"
          >
            <HomeIcon className="h-4 w-4" />
            Ir al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
