"use client";

import {
  CloudArrowUpIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { register } from "@/services/shared/auth-service";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function scrollToElementSmoothly(element: HTMLElement, duration = 900) {
  const start = window.scrollY;
  const target = element.getBoundingClientRect().top + window.scrollY - 24;
  const distance = target - start;
  const startTime = performance.now();

  function easeInOutCubic(progress: number) {
    return progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    window.scrollTo(0, start + distance * easeInOutCubic(progress));

    if (progress < 1) {
      window.requestAnimationFrame(animate);
    }
  }

  window.requestAnimationFrame(animate);
}

export default function RegisterForm() {
  const formPanelRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPsw, setShowPsw] = useState(false);
  const [showConfirmPsw, setShowConfirmPsw] = useState(false);
  const profilePreviewUrl = useMemo(
    () => (profilePic ? URL.createObjectURL(profilePic) : ""),
    [profilePic],
  );

  useEffect(() => {
    if (!window.matchMedia("(max-width: 1023px)").matches) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (!formPanelRef.current) {
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        formPanelRef.current.scrollIntoView({ block: "start" });
        nameInputRef.current?.focus({ preventScroll: true });
        return;
      }

      scrollToElementSmoothly(formPanelRef.current);
      window.setTimeout(() => {
        nameInputRef.current?.focus({ preventScroll: true });
      }, 900);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    return () => {
      if (profilePreviewUrl) {
        URL.revokeObjectURL(profilePreviewUrl);
      }
    };
  }, [profilePreviewUrl]);

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
    setPasswordError(null);
    setSubmitError(null);
  }

  function handleConfirmChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.value && event.target.value !== password) {
      setPasswordError("Las contraseñas no coinciden");
    } else {
      setPasswordError(null);
    }
    setSubmitError(null);
  }

  function selectProfilePic(file?: File) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFileError("Solo se permiten imágenes");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError("La foto no puede superar los 5MB");
      return;
    }

    setProfilePic(file);
    setFileError(null);
    setSubmitError(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectProfilePic(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    selectProfilePic(event.dataTransfer.files[0]);
  }

  function removeProfilePic() {
    setProfilePic(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const passwordValue = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    if (passwordValue !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await register({
        name: String(formData.get("name") ?? "").trim(),
        document: String(formData.get("document") ?? "").trim(),
        phone: String(formData.get("phone") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
        password: passwordValue,
        profile_pic: profilePic ?? "",
      });
      setIsRegistered(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al registrar";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isRegistered) {
    return (
      <div className="w-full max-w-[460px] rounded-[28px] border border-gray-200 bg-white px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900 sm:px-9 sm:py-10">
        <div className="flex flex-col items-center py-6 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            ¡Cuenta creada exitosamente!
          </h2>
          <p className="mt-4 max-w-xs text-sm font-medium leading-6 text-slate-400 dark:text-slate-400">
            Te enviamos un correo de confirmación.
          </p>
          <Link
            href="/login"
            className="btn-secondary mt-8 flex items-center !justify-center text-center"
          >
            Iniciá sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={formPanelRef}
      className="scroll-mt-6 w-full max-w-[460px] rounded-[28px] border border-gray-200 bg-white px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900 sm:px-9 sm:py-10 lg:max-w-[700px]"
    >
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">
          Crear cuenta cliente
        </h1>
        <p className="mt-3 text-sm font-medium leading-4 text-slate-400 dark:text-slate-400">
          Completá tus datos para registrarte y comenzar a hacer pedidos en Eating Time.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 space-y-5 sm:mt-8">
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            Nombre y apellido
          </label>
          <input
            ref={nameInputRef}
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Tu nombre completo"
            className="field"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="document"
              className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              Documento de identidad
            </label>
            <input
              id="document"
              name="document"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="document"
              placeholder="Sin puntos ni guiones"
              className="field"
              required
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
            >
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

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
          >
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

        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPsw ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Creá tu contraseña"
                  minLength={8}
                  className="field pr-12"
                  onChange={handlePasswordChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPsw((value) => !value)}
                  tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPsw ? (
                    <EyeSlashIcon className="w-[20px]" />
                  ) : (
                    <EyeIcon className="w-[20px]" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                Debe tener al menos 8 caracteres.
              </p>
            </div>
            <div>
              <label
                htmlFor="confirm_password"
                className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPsw ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repetí la contraseña"
                  className={`field pr-12 ${passwordError ? "!border-red-400" : ""}`}
                  onChange={handleConfirmChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPsw((value) => !value)}
                  tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPsw ? (
                    <EyeSlashIcon className="w-[20px]" />
                  ) : (
                    <EyeIcon className="w-[20px]" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="mt-2 text-xs font-medium text-red-500">
                  {passwordError}
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="profile_pic"
            className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            Foto de perfil
          </label>
          <div
            role="button"
            tabIndex={0}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className="flex min-h-[92px] w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-orange-300 bg-orange-50 px-4 py-4 text-center transition hover:border-orange-500 hover:bg-orange-100 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none dark:border-orange-500/40 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 dark:focus:ring-orange-500/20"
          >
            {profilePic ? (
              <div className="flex w-full items-center gap-3 text-left">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-orange-200 bg-white dark:border-orange-500/30 dark:bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profilePreviewUrl}
                    alt={profilePic.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">
                    {profilePic.name}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                    Hacé clic para cambiar la imagen
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Quitar foto de perfil"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeProfilePic();
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-orange-600 hover:text-white dark:bg-slate-900 dark:text-slate-300"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <span className="flex items-center gap-2 text-sm font-black text-orange-600 dark:text-orange-300">
                <CloudArrowUpIcon className="h-5 w-5" />
                Arrastrá una imagen o seleccioná un archivo
              </span>
            )}
          </div>
          <input
            ref={fileInputRef}
            id="profile_pic"
            name="profile_pic"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
          />
          {fileError ? (
            <span className="mt-2 block text-xs font-semibold text-red-500">
              {fileError}
            </span>
          ) : (
            <span className="mt-2 block text-xs text-gray-400">
              Opcional · Máximo 5MB · JPG, PNG o similar
            </span>
          )}
        </div>

        {submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !!fileError || !!passwordError}
          className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Creando..." : "Crear cuenta"}
        </button>
      </form>

      <div className="my-8 h-px bg-gray-200 dark:bg-slate-800" />
      <p className="text-center text-sm text-gray-500 dark:text-slate-400">
        ¿Ya tenés una cuenta?{" "}
        <Link href="/login" className="text-orange-600 hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
