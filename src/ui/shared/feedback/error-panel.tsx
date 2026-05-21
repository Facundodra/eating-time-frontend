import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

type ErrorPanelProps = {
  onReset: () => void;
};

export default function ErrorPanel({ onReset }: ErrorPanelProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10">
          <ExclamationTriangleIcon className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          Ocurrio un error
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Algo no salio como esperabamos. Podes intentar cargar la pantalla otra vez.
        </p>
        <button
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
          onClick={onReset}
          type="button"
        >
          Reintentar
        </button>
      </section>
    </main>
  );
}
