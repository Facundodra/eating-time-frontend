"use client";

import {
  CameraIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  KeyIcon,
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

import { editUserData, getCurrentSession } from "@/services/shared/auth-service";
import LoadingButton from "@/ui/shared/buttons/loading-button";
import LoadingIndicator from "@/ui/shared/feedback/loading-indicator";
import ProfilePicture from "@/ui/shared/widgets/profile-picture";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type InitialFormData = {
  name: string;
  phone: string;
};

export default function RestaurantMyDataPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fileError, setFileError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [initialFormData, setInitialFormData] = useState<InitialFormData>({
    name: "",
    phone: "",
  });

  const profilePreviewUrl = useMemo(
    () => (profilePhoto ? URL.createObjectURL(profilePhoto) : null),
    [profilePhoto],
  );
  const displayPhotoUrl = profilePreviewUrl ?? currentPhotoUrl;
  const savedPhotoUrl = currentPhotoUrl;
  const hasFormChanges =
    name !== initialFormData.name ||
    phone !== initialFormData.phone ||
    profilePhoto !== null;

  useEffect(() => {
    return () => {
      if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
    };
  }, [profilePreviewUrl]);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const session = await getCurrentSession();
        if (cancelled || !session) return;

        const sessionName = session.nombre ?? "";
        const sessionPhone = session.telefono ?? "";

        setName(sessionName);
        setEmail(session.correo ?? session.email ?? "");
        setPhone(sessionPhone);
        setCurrentPhotoUrl(session.urlFoto ?? null);
        setInitialFormData({
          name: sessionName,
          phone: sessionPhone,
        });
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar los datos del local.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  function selectProfilePhoto(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFileError("Solo se permiten imagenes.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError("La imagen no puede superar los 5MB.");
      return;
    }

    setProfilePhoto(file);
    setFileError("");
    setSuccessMessage("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectProfilePhoto(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    selectProfilePhoto(event.dataTransfer.files[0]);
  }

  function removeProfilePhoto() {
    setProfilePhoto(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function cancelChanges() {
    setName(initialFormData.name);
    setPhone(initialFormData.phone);
    setProfilePhoto(null);
    setFileError("");
    setErrorMessage("");
    setSuccessMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const nextName = name.trim();
      const nextPhone = phone.trim();

      await editUserData(nextName, nextPhone, profilePhoto);
      const updatedSession = await getCurrentSession();
      const nextPhotoUrl = updatedSession?.urlFoto ?? currentPhotoUrl;

      setSuccessMessage("Los datos del local se actualizaron correctamente.");
      setCurrentPhotoUrl(nextPhotoUrl);
      setEmail(updatedSession?.correo ?? updatedSession?.email ?? email);
      setName(nextName);
      setPhone(nextPhone);
      setInitialFormData({
        name: nextName,
        phone: nextPhone,
      });
      setProfilePhoto(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los datos del local.",
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
              Actualiza la informacion visible del local y su foto de perfil.
            </p>
          </div>

          <div className="space-y-5 px-5 py-5">
            {isLoading ? (
              <div className="py-10">
                <LoadingIndicator label="Cargando datos del local..." />
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Nombre del local
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
                      Telefono
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
                    Correo electronico
                  </span>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="h-11 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-slate-50 px-4 text-sm font-semibold text-slate-500 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
                  />
                </label>

                <div>
                  <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Foto de perfil
                  </span>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    className="flex min-h-[100px] cursor-pointer items-center justify-center rounded-xl border border-dashed border-orange-300 bg-orange-50/70 px-5 py-4 text-center transition hover:border-orange-500 hover:bg-orange-50 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100 dark:border-orange-500/30 dark:bg-orange-500/10 dark:hover:bg-orange-500/15 dark:focus:ring-orange-500/20"
                  >
                    {displayPhotoUrl ? (
                      <div className="flex w-full flex-col items-center gap-5 sm:flex-row sm:items-center sm:text-left">
                        <div className="flex h-48 w-48 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-600 shadow-sm ring-4 ring-orange-100 dark:ring-slate-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={displayPhotoUrl}
                            alt="Foto del local"
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center sm:items-start sm:text-left">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">
                              {profilePhoto ? profilePhoto.name : "Foto actual"}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Arrastra una imagen o hace click para cambiarla.
                            </p>
                          </div>

                          {profilePhoto ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                removeProfilePhoto();
                              }}
                              className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-xs font-extrabold text-slate-500 shadow-sm transition hover:bg-orange-600 hover:text-white dark:bg-slate-950 dark:text-slate-300"
                              aria-label="Quitar foto seleccionada"
                            >
                              Quitar foto
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-left">
                        <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-orange-500 shadow-sm dark:bg-slate-950">
                          <CloudArrowUpIcon className="h-7 w-7" />
                        </span>
                        <div>
                          <p className="text-sm font-black text-orange-700 dark:text-orange-300">
                            Arrastrar imagen o seleccionar archivo
                          </p>
                          <p className="mt-1 text-xs font-semibold text-orange-600/70 dark:text-orange-200/70">
                            JPG, PNG o similar. Maximo 5MB.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  {fileError ? (
                    <p className="mt-2 text-xs font-bold text-red-500">
                      {fileError}
                    </p>
                  ) : null}
                </div>

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
                    disabled={Boolean(fileError)}
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
                <LoadingIndicator label="Cargando resumen del local..." />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ProfilePicture
                  imageUrl={savedPhotoUrl}
                  alt="Foto del local"
                  className="h-24 w-24 ring-orange-100 dark:ring-slate-900"
                />
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-slate-950 dark:text-white">
                    {initialFormData.name || "Local"}
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
                  Cambia la contraseña de acceso al panel del local.
                </p>
              </div>
            </div>
            <Link
              href="/restaurant/change-password"
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-700 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
            >
              Cambiar contraseña
            </Link>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-5 text-sm font-semibold text-orange-900 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-100">
            <CameraIcon className="mb-3 h-5 w-5" />
            Una buena foto ayuda a que el local sea reconocible en el sistema.
          </div>
        </aside>
      </div>
    </section>
  );
}
