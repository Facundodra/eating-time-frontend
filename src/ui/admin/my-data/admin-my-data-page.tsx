"use client";

import {
  CheckCircleIcon,
  KeyIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState } from "react";

import { editUserData, getCurrentSession } from "@/services/shared/auth-service";
import LoadingButton from "@/ui/shared/buttons/loading-button";
import LoadingIndicator from "@/ui/shared/feedback/loading-indicator";

type InitialFormData = {
  name: string;
  phone: string;
};

export default function AdminMyDataPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [initialFormData, setInitialFormData] = useState<InitialFormData>({
    name: "",
    phone: "",
  });

  const hasFormChanges =
    name !== initialFormData.name || phone !== initialFormData.phone;

  const loadSession = useCallback(async (cancelled: () => boolean) => {
    const session = await getCurrentSession();

    if (cancelled() || !session) return;

    const sessionName = session.nombre ?? "";
    const sessionPhone = session.telefono ?? "";

    setName(sessionName);
    setEmail(session.correo ?? session.email ?? "");
    setPhone(sessionPhone);
    setInitialFormData({
      name: sessionName,
      phone: sessionPhone,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        await loadSession(() => cancelled);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar los datos del administrador.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [loadSession]);

  function cancelChanges() {
    setName(initialFormData.name);
    setPhone(initialFormData.phone);
    setSuccessMessage("");
    setErrorMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const nextName = name.trim();
      const nextPhone = phone.trim();

      await editUserData(nextName, nextPhone, null);

      const updatedSession = await getCurrentSession();

      setSuccessMessage("Los datos del administrador se actualizaron correctamente.");
      setEmail(updatedSession?.correo ?? updatedSession?.email ?? email);
      setName(nextName);
      setPhone(nextPhone);
      setInitialFormData({
        name: nextName,
        phone: nextPhone,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los datos del administrador.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Actualiza los datos de tu cuenta administrativa.
            </p>
          </div>

          <div className="space-y-5 px-5 py-5">
            {isLoading ? (
              <div className="py-10">
                <LoadingIndicator label="Cargando datos del administrador..." />
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Nombre
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      disabled={isSubmitting}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Teléfono
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      disabled={isSubmitting}
                      placeholder="Ej: 099123456"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Correo electrónico
                  </span>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="h-11 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-slate-50 px-4 text-sm font-semibold text-slate-500 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
                  />
                </label>

                {successMessage ? (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <CheckCircleIcon className="h-5 w-5" />
                    {successMessage}
                  </div>
                ) : null}

                {errorMessage ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
                  {hasFormChanges ? (
                    <button
                      type="button"
                      onClick={cancelChanges}
                      disabled={isSubmitting}
                      className="h-11 cursor-pointer rounded-xl bg-slate-100 px-5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Cancelar
                    </button>
                  ) : null}
                  <LoadingButton
                    type="submit"
                    isLoading={isSubmitting}
                    loadingText="Guardando..."
                    className="h-11 w-full rounded-xl bg-orange-600 px-4 text-sm font-extrabold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-orange-500/20 sm:w-fit"
                  >
                    Guardar cambios
                  </LoadingButton>
                </div>
              </>
            )}
          </div>
        </form>

        <aside className="space-y-4">
          <div className="hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:block dark:border-slate-800 dark:bg-slate-900">
            {isLoading ? (
              <div className="py-10">
                <LoadingIndicator label="Cargando resumen de cuenta..." />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-600 ring-4 ring-orange-100 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-slate-900">
                  <UserIcon className="h-9 w-9" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-slate-950 dark:text-white">
                    {initialFormData.name || "Administrador"}
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {email || "Correo no disponible"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                <KeyIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white">
                  Seguridad
                </h3>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Cambia la contraseña de acceso al panel administrativo.
                </p>
              </div>
            </div>
            <Link
              href="/admin/change-password"
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-700 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
            >
              Cambiar contraseña
            </Link>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-5 text-sm font-semibold text-orange-900 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-100">
            <ShieldCheckIcon className="mb-3 h-5 w-5" />
            Mantener tus datos actualizados ayuda a identificar correctamente
            las acciones administrativas.
          </div>
        </aside>
      </div>
    </section>
  );
}
