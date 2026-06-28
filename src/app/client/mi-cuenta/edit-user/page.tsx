import Link from "next/link";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

import EditUserPage from "@/ui/shared/auth/edit-user-page";

export default function ClientEditUserPage() {
    return (
        <>
            <section className="titulo-seccion w-full">
                <Link
                    href="/client/mi-cuenta"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 transition-colors hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-300"
                >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Volver a mi cuenta
                </Link>
                <h1 className="titulo mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    Editar perfil
                </h1>
                <p className="descripcion mt-1 text-sm text-gray-500 dark:text-slate-400">
                    Actualizá tus datos personales y tu foto de perfil.
                </p>
            </section>
            <EditUserPage backHref="/client/mi-cuenta" />
        </>
    );
}
