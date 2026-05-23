import EatingTimeLogo from "@/ui/shared/images/logo.png";
import LoginFoodImage from "@/ui/auth/images/login-food.png";
import RegisterForm from "./register-form";

import Image from "next/image";
import Link from "next/link";

export default function RegisterPage() {
    return (
        <>
            <main className="min-h-screen bg-[#fbf8f5] px-6 py-8 text-slate-900 sm:px-10 lg:px-14">
                <div className="mx-auto flex flex-wrap min-h-[calc(100vh-64px)] w-full max-w-[1440px] items-center ">
                    {/* Seccion izqquierda, titulo mas imagen */}
                    <section className="w-[60%] flex h-full flex-col justify-center">
                        <Link href="/" className="flex w-fit items-center gap-4">
                            <Image
                            src={EatingTimeLogo}
                            alt="Eating Time"
                            width={42}
                            height={42}
                            className="h-[42px] w-[42px] rounded-xl shadow-sm"
                            priority
                            />
                            <span className="text-2xl font-extrabold tracking-tight">
                            Eating Time
                            </span>
                        </Link>

                        <div className="mt-12 w-fit rounded-full bg-orange-100 px-4 py-2 text-xs font-extrabold text-orange-600">
                            Plataforma de pedidos y delivery
                        </div>

                        <h1 className="mt-7 max-w-[620px] text-[42px] leading-[0.98] font-black tracking-tight text-slate-900 sm:text-[56px] lg:text-[64px]">
                            Creá tu cuenta y empezá a pedir en minutos.
                        </h1>

                        <p className="mt-7 max-w-[520px] text-base leading-8 font-medium text-slate-400">
                            Registrate como cliente para descubrir locales, realizar pedidos y consultar tu historial desde la web o la app mobile.
                        </p>

                        <div className="mt-10 w-full max-w-[520px] overflow-hidden rounded-[24px] shadow-[0_26px_70px_rgba(15,23,42,0.16)]">
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

                    {/* Seccion derecha, formulario de registro */}
                    <section className="w-[40%] flex justify-center lg:justify-end">
                        <RegisterForm />
                    </section>
                </div>
                </main>
        </>
    );
}