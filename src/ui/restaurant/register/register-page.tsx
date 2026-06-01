import Link from "next/link";
import { UserIcon } from "@heroicons/react/24/outline";
import EatingTimeBrand from "@/ui/shared/brand/eating-time-brand";
import RegisterForm from "./register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f7] dark:bg-slate-950">
      <header className="sticky top-0 z-10 flex h-[62px] items-center gap-4 border-b border-gray-100 bg-white px-6 dark:border-slate-800 dark:bg-slate-900 sm:px-10">
        <Link href="/login" className="flex items-center gap-2.5">
          <EatingTimeBrand
            iconSize={42}
            iconClassName="h-[42px] w-[42px] rounded-[11px]"
            textClassName="text-xl font-semibold"
            priority
          />
        </Link>

        <div className="ml-auto">
          <Link
            href="/login"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-orange-600 bg-white px-4 text-[13px] font-medium text-orange-600 transition hover:bg-orange-50 dark:border-orange-500 dark:bg-slate-900 dark:hover:bg-orange-500/10"
          >
            <UserIcon className="h-4 w-4" aria-hidden />
            Iniciar sesión
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-8 sm:px-6 sm:py-10">
        <RegisterForm />
      </main>
    </div>
  );
}
