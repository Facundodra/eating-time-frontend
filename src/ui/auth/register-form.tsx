"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

import { registerAction } from "@/app/register/actions";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPsw, setShowPsw] = useState(false);
  const [showConfirmPsw, setShowConfirmPsw] = useState(false);

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
    setPasswordError(null);
  }

  function handleConfirmChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value && e.target.value !== password) {
      setPasswordError("Las contraseñas no coinciden");
    } else {
      setPasswordError(null);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.size > MAX_FILE_SIZE) {
      setFileError("La foto no puede superar los 5MB");
      e.target.value = "";
    } else {
      setFileError(null);
    }
  }

  if (state && "success" in state) {
    return (
      <div className="w-full rounded-[28px] border border-gray-200 bg-white px-9 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <div className="flex flex-col items-center text-center py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            ¡Cuenta creada exitosamente!
          </h2>
          <p className="mt-4 text-sm font-medium text-slate-400 leading-6 max-w-xs">
            Te enviamos un correo de confirmación.
          </p>
          <Link
            href="/login"
            className="btn-secondary mt-8 text-center flex items-center !justify-center"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[28px] border border-gray-200 bg-white px-9 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">
          Crear cuenta cliente
        </h1>
        <p className="mt-3 text-sm font-medium text-slate-400 leading-4">
          Completa tus datos para registrarte y comenzar a hacer pedidos en Eating Time.
        </p>
      </div>

      <form action={formAction} className="mt-8 space-y-5">
        {/* Nombre */}
        <div>
          <label htmlFor="name" className="mb-2 block text-xs font-bold text-slate-600">
            Nombre y apellido
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Tu nombre completo"
            className="field"
            required
          />
        </div>

        {/* Cedula y telefono */}
        <div className="flex align-center flex-wrap">
          <div className="w-1/2 pr-2">
            <label htmlFor="document" className="mb-2 block text-xs font-bold text-slate-600">
              Documento de identidad
            </label>
            <input
              id="document"
              name="document"
              type="number"
              autoComplete="document"
              placeholder="Sin puntos ni guiones"
              className="field"
              required
            />
          </div>
          <div className="w-1/2 pl-2">
            <label htmlFor="phone" className="mb-2 block text-xs font-bold text-slate-600">
              Teléfono
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              autoComplete="phone"
              placeholder="Ej: 099123456"
              className="field"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="mb-2 block text-xs font-bold text-slate-600">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nombre@email.com"
            className="field"
            required
          />
        </div>

        {/* Contraseña */}
        <div>
          <div className="flex align-center flex-wrap">
            <div className="w-1/2 pr-2 relative">
              <label htmlFor="password" className="mb-2 block text-xs font-bold text-slate-600">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type={showPsw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Creá tu contraseña"
                className="field pr-[30px]"
                onChange={handlePasswordChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPsw(v => !v)}
                tabIndex={-1}
                className="absolute bottom-[13px] right-[20px] text-slate-400 hover:text-slate-600"
              >
                {showPsw ? <EyeSlashIcon className="w-[20px]" /> : <EyeIcon className="w-[20px]" />}
              </button>
            </div>
            <div className="w-1/2 pl-2 relative">
              <label htmlFor="confirm_password" className="mb-2 block text-xs font-bold text-slate-600">
                Confirmar contraseña
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type={showConfirmPsw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repetí la contraseña"
                className={`field pr-[30px] ${passwordError ? "!border-red-400" : ""}`}
                onChange={handleConfirmChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPsw(v => !v)}
                tabIndex={-1}
                className="absolute bottom-[13px] right-[20px] text-slate-400 hover:text-slate-600"
              >
                {showConfirmPsw ? <EyeSlashIcon className="w-[20px]" /> : <EyeIcon className="w-[20px]" />}
              </button>
            </div>
          </div>
          {passwordError && (
            <p className="mt-2 text-xs font-medium text-red-500">{passwordError}</p>
          )}
        </div>

        {/* Foto */}
        <div>
          <label htmlFor="profile_pic" className="mb-2 block text-xs font-bold text-slate-600">
            Foto de perfil
          </label>
          <input
            id="profile_pic"
            name="profile_pic"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="field bg-orange-50 !border-orange-700 border-dashed !py-3 !text-xs file:text-orange-700 file:font-bold file:mr-4 file:cursor-pointer file:text-sm"
          />
          {fileError
            ? <span className="text-red-500 text-xs">{fileError}</span>
            : <span className="text-gray-400 text-xs">Opcional · Máximo 5MB · JPG, PNG o similar</span>
          }
        </div>

        {state?.error === "Bad Request" && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            El email o la cédula ya están registrados
          </p>          
        )}

        <button
          type="submit"
          disabled={!!fileError || !!passwordError}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Crear cuenta
        </button>
      </form>

      <div className="my-8 h-px bg-gray-200" />
      <p className="text-center text-gray-500 text-sm">
        ¿Ya tienes una cuenta?{" "}
        <Link href="/login" className="text-orange-600 hover:underline">Inicia sesión</Link>
      </p>
    </div>
  );
}
