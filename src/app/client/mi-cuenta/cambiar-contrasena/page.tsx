import Link from "next/link";

import ChangePasswordPage from "@/ui/shared/auth/change-password-page";

export default function ClientChangePasswordPage() {
  return (
    <>
      <section className="titulo-seccion w-full">
        <span className="ruta text-xs text-gray-400">
          <Link href="/client">Inicio</Link> /{" "}
          <Link href="/client/mi-cuenta">Mi cuenta</Link> / Cambiar contraseña
        </span>
        <h1 className="titulo mt-2 text-3xl font-bold text-gray-900">
          Cambiar contraseña
        </h1>
        <p className="descripcion mt-1 text-sm text-gray-500">
          Actualizá tu contraseña de acceso.
        </p>
      </section>
      <ChangePasswordPage backHref="/client/mi-cuenta" />
    </>
  );
}
