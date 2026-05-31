import Image from "next/image";
import Link from "next/link";

import LoginFoodImage from "@/ui/auth/images/login-food.png";
import RegisterForm from "./register-form";
import ThemeToggle from "@/ui/shared/theme/theme-toggle";
import EatingTimeBrand from "@/ui/shared/brand/eating-time-brand";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#fbf8f5] px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-8 lg:px-14">
      <div className="fixed right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-48px)] w-full max-w-[1440px] items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] lg:gap-12 xl:gap-24">
        <section className="flex flex-col justify-center lg:h-full">
          <Link href="/" className="flex w-fit items-center gap-4">
            <EatingTimeBrand
              iconSize={42}
              iconClassName="h-[42px] w-[42px] shadow-sm"
              textClassName="text-2xl"
              priority
            />
          </Link>

          <div className="mt-8 hidden w-fit rounded-full bg-orange-100 px-4 py-2 text-xs font-extrabold text-orange-600 dark:bg-orange-500/10 dark:text-orange-300 sm:mt-12 lg:block">
            Plataforma de pedidos y delivery
          </div>

          <h1 className="mt-6 hidden max-w-[620px] text-4xl leading-tight font-black tracking-tight text-slate-900 dark:text-white sm:mt-7 sm:text-5xl sm:leading-[1.02] lg:block lg:text-[64px] lg:leading-[0.98]">
            Creá tu cuenta y empezá a pedir en minutos.
          </h1>

          <p className="mt-5 hidden max-w-[520px] text-base leading-7 font-medium text-slate-400 dark:text-slate-300 sm:mt-7 sm:leading-8 lg:block">
            Registrate como cliente para descubrir locales, realizar pedidos y
            consultar tu historial desde la web o la app mobile.
          </p>

          <div className="mt-8 hidden w-full max-w-[520px] overflow-hidden rounded-[24px] shadow-[0_26px_70px_rgba(15,23,42,0.16)] lg:block lg:mt-10">
            <Image
              src={LoginFoodImage}
              alt="Platos servidos sobre una mesa"
              width={520}
              height={346}
              className="aspect-[3/2] w-full object-cover"
              priority
            />
          </div>
        </section>

        <section className="flex min-w-0 justify-center lg:justify-end">
          <RegisterForm />
        </section>
      </div>
    </main>
  );
}
