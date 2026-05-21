import { ClockIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

type ComingSoonPageProps = {
  backHref?: string;
  backLabel?: string;
  description?: string;
  title: string;
};

export default function ComingSoonPage({
  backHref = "/",
  backLabel = "Volver al inicio",
  description = "Esta seccion todavia no esta implementada. La dejamos preparada para continuar el desarrollo sin romper la navegacion.",
  title,
}: ComingSoonPageProps) {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/10">
          <ClockIcon className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {description}
        </p>
        <Link
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
          href={backHref}
        >
          {backLabel}
        </Link>
      </div>
    </section>
  );
}
