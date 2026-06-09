import Image from "next/image";
import Link from "next/link";

import LoginFoodImage from "@/ui/shared/auth/images/login-food.png";
import EatingTimeLogo from "@/ui/shared/images/logo.png";
import ThemeToggle from "@/ui/shared/theme/theme-toggle";

import RegisterForm from "./register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#fbf8f5] px-6 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-10 lg:px-14">
      <div className="fixed top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-[1440px] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_460px] xl:gap-20">
        <section className="flex h-full flex-col justify-center">
          <Link href="/" className="flex w-fit items-center gap-4">
            <Image
              src={EatingTimeLogo}
              alt="Eating Time"
              width={42}
              height={42}
              className="h-[42px] w-[42px] rounded-xl shadow-sm"
              priority
            />
            <span className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50">
              Eating<span className="text-red-600 dark:text-red-500">Time</span>
            </span>
          </Link>

          <div className="mt-10 w-fit rounded-full bg-orange-100 px-4 py-2 text-xs font-extrabold text-orange-600 dark:bg-orange-500/10 dark:text-orange-300 sm:mt-12">
            Plataforma de pedidos y delivery
          </div>

          <h1 className="mt-7 max-w-[620px] text-[34px] leading-[1] font-black tracking-tight text-slate-900 dark:text-white sm:text-[48px] lg:text-[64px]">
            Creá tu cuenta y empezá a pedir en minutos.
          </h1>

          <p className="mt-5 max-w-[520px] text-sm leading-7 font-medium text-slate-400 dark:text-slate-300 sm:mt-7 sm:text-base sm:leading-8">
            Registrate como cliente para descubrir locales, realizar pedidos y
            consultar tu historial desde la web o la app mobile.
          </p>

          <div className="mt-8 w-full max-w-[520px] overflow-hidden rounded-[20px] shadow-[0_18px_45px_rgba(15,23,42,0.14)] sm:mt-10 lg:rounded-[24px] lg:shadow-[0_26px_70px_rgba(15,23,42,0.16)]">
            <Image
              src={LoginFoodImage}
              alt="Platos servidos sobre una mesa"
              width={520}
              height={346}
              className="h-[120px] w-full object-cover sm:h-[160px] lg:h-auto lg:aspect-[3/2]"
              priority
            />
          </div>
        </section>

        <section className="flex justify-center lg:justify-end">
          <RegisterForm />
        </section>
      </div>
    </main>
  );
}
