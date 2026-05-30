"use client";

import {
  IdentificationIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import type { AccountProfile } from "@/lib/account/types";
import {
  getAccountProfile,
  getAccountRoleLabel,
  updateAccountProfile,
} from "@/services/account-service";
import LoadingButton from "@/ui/shared/buttons/loading-button";

type MyDataPageProps = {
  changePasswordHref: string;
};

export default function MyDataPage({ changePasswordHref }: MyDataPageProps) {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const data = await getAccountProfile();

        if (isMounted) {
          setProfile(data);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar tus datos.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setMessage("");
    setErrorMessage("");
    setIsSaving(true);

    try {
      const updatedProfile = await updateAccountProfile({
        nombre: String(formData.get("nombre") ?? ""),
        email: String(formData.get("email") ?? ""),
        telefono: String(formData.get("telefono") ?? ""),
        direccion:
          profile?.tipoUsuario === "LOCAL"
            ? String(formData.get("direccion") ?? "")
            : undefined,
        descripcion:
          profile?.tipoUsuario === "LOCAL"
            ? String(formData.get("descripcion") ?? "")
            : undefined,
      });

      setProfile(updatedProfile);
      setMessage("Tus datos se actualizaron correctamente.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron actualizar tus datos.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Cargando tus datos...
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
              <UserCircleIcon className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-950 dark:text-white">
              Mis datos
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Revisá y actualizá la información principal de tu cuenta.
            </p>
          </div>
          {profile ? (
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-600 dark:bg-slate-950 dark:text-slate-300">
              {getAccountRoleLabel(profile.tipoUsuario)}
            </span>
          ) : null}
        </div>

        {errorMessage ? (
          <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {errorMessage}
          </p>
        ) : null}

        {message ? (
          <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            {message}
          </p>
        ) : null}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field
            label="Nombre"
            name="nombre"
            defaultValue={profile?.nombre}
            required
          />
          <Field
            label="Correo electrónico"
            name="email"
            type="email"
            defaultValue={profile?.email}
            required
          />
          <Field
            label="Teléfono"
            name="telefono"
            type="tel"
            defaultValue={profile?.telefono}
          />
          <Field
            label="Documento"
            name="documento"
            defaultValue={profile?.documento}
            disabled
          />
          {profile?.tipoUsuario === "LOCAL" ? (
            <>
              <Field
                label="Dirección"
                name="direccion"
                defaultValue={profile.direccion}
              />
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Descripción
                </span>
                <textarea
                  name="descripcion"
                  defaultValue={profile.descripcion}
                  rows={4}
                  className="field min-h-28 py-3"
                />
              </label>
            </>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <Link
            href={changePasswordHref}
            className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-bold text-orange-600 transition hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-500/10"
          >
            Cambiar contraseña
          </Link>
          <LoadingButton
            type="submit"
            isLoading={isSaving}
            loadingText="Guardando..."
            disabled={!profile}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-orange-600 px-5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Guardar cambios
          </LoadingButton>
        </div>
      </form>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
          <ShieldCheckIcon className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-base font-bold text-slate-950 dark:text-white">
          Información de cuenta
        </h2>
        <div className="mt-4 space-y-3">
          <InfoItem label="ID de usuario" value={profile?.idUsuario} />
          <InfoItem label="ID del perfil" value={profile?.idTipoUsuario} />
        </div>
        <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
          <IdentificationIcon className="h-5 w-5 text-orange-600 dark:text-orange-300" />
          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Algunos datos pueden requerir validación del sistema antes de verse
            reflejados en otros módulos.
          </p>
        </div>
      </aside>
    </section>
  );
}

type FieldProps = {
  defaultValue?: string;
  disabled?: boolean;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
};

function Field({
  defaultValue,
  disabled,
  label,
  name,
  required,
  type = "text",
}: FieldProps) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
        className="field disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
      />
    </label>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: number | string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
        {value || "-"}
      </p>
    </div>
  );
}
