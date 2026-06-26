import Link from "next/link";

import EditUserPage from "@/ui/shared/auth/edit-user-page";

export default function ClientEditUserPage() {
    return (
        <>
            <section className="titulo-seccion w-full">
                <span className="ruta text-xs text-gray-400 dark:text-slate-500">
                    <Link href="/client">Inicio</Link> /{" "}
                    <Link href="/client/mi-cuenta">Mi cuenta</Link> / Editar perfil
                </span>
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
