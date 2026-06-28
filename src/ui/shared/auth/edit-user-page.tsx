"use client";

import {
  CheckCircleIcon,
  CloudArrowUpIcon,
  IdentificationIcon,
  PhotoIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { UserIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type Props = { backHref: string; showPhoto?: boolean };

type InitialFormData = {
  name: string;
  phone: string;
  photoUrl: string | null;
};

export default function EditUserPage({ backHref, showPhoto = true }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [initialFormData, setInitialFormData] = useState<InitialFormData>({
    name: "",
    phone: "",
    photoUrl: null,
  });

  const profilePreviewUrl = useMemo(
    () => (profilePic ? URL.createObjectURL(profilePic) : null),
    [profilePic],
  );
  const previewUrl = profilePreviewUrl ?? currentPhotoUrl;
  const hasFormChanges =
    name !== initialFormData.name ||
    phone !== initialFormData.phone ||
    profilePic !== null;

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
        const sessionPhotoUrl = session.urlFoto ?? null;

        setName(sessionName);
        setPhone(sessionPhone);
        setCurrentPhotoUrl(sessionPhotoUrl);
        setInitialFormData({
          name: sessionName,
          phone: sessionPhone,
          photoUrl: sessionPhotoUrl,
        });
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar tus datos.",
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

  function selectProfilePic(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFileError("Solo se permiten imágenes.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError("La foto no puede superar 5 MB.");
      return;
    }

    setProfilePic(file);
    setFileError("");
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectProfilePic(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    selectProfilePic(event.dataTransfer.files[0]);
  }

  function removeProfilePic() {
    setProfilePic(null);
    setFileError("");
    setErrorMessage("");
    setSuccessMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function clearForm() {
    setName(initialFormData.name);
    setPhone(initialFormData.phone);
    setCurrentPhotoUrl(initialFormData.photoUrl);
    setProfilePic(null);
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
      await editUserData(name, phone, showPhoto ? profilePic : null);
      const updatedSession = await getCurrentSession();
      const updatedPhotoUrl = updatedSession?.urlFoto ?? currentPhotoUrl;

      router.refresh();
      setProfilePic(null);
      setCurrentPhotoUrl(updatedPhotoUrl);
      setInitialFormData({
        name,
        phone,
        photoUrl: updatedPhotoUrl,
      });
      setSuccessMessage("Tus datos se actualizaron correctamente.");
    } catch (error) {
      if (error instanceof Error && error.message === "Tu sesión expiró.") {
        router.replace("/login");
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo editar el usuario. Intentalo nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white px-5 py-12 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <LoadingIndicator label="Cargando tus datos..." />
      </section>
    );
  }

  return (
    <section className="mt-6 space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                <UserCircleIcon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                  Editar perfil
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Actualizá los datos visibles de tu cuenta.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  Nombre
                </span>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setSuccessMessage("");
                    setErrorMessage("");
                  }}
                  disabled={isSubmitting}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  Teléfono
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  autoComplete="tel"
                  placeholder="Ej: 099123456"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setSuccessMessage("");
                    setErrorMessage("");
                  }}
                  disabled={isSubmitting}
                />
              </label>
            </div>

            {showPhoto ? (
              <div>
                <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  Foto de perfil
                </span>
                <label
                  htmlFor="photo_url"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop}
                  className="flex min-h-[120px] w-full cursor-pointer items-center justify-center rounded-2xl border border-dashed border-orange-300 bg-orange-50 px-4 py-4 text-center transition hover:border-orange-500 hover:bg-orange-100 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-100 dark:border-orange-500/40 dark:bg-orange-500/10 dark:hover:border-orange-400 dark:hover:bg-orange-500/15 dark:focus-within:ring-orange-500/20"
                >
                  {previewUrl ? (
                    <div className="flex w-full items-center gap-4 text-left">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-orange-200 bg-white dark:border-orange-500/30 dark:bg-slate-950">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt={profilePic?.name ?? "Foto de perfil"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">
                          {profilePic ? profilePic.name : "Foto actual"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                          Hacé clic para cambiar la imagen
                        </p>
                      </div>
                      {profilePic ? (
                        <button
                          type="button"
                          aria-label="Quitar foto seleccionada"
                          onClick={(event) => {
                            event.preventDefault();
                            removeProfilePic();
                          }}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm transition hover:bg-orange-600 hover:text-white dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-orange-500 dark:hover:text-white"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex w-full items-center gap-4 text-left">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-orange-200 bg-white text-orange-300 dark:border-orange-500/30 dark:bg-slate-950 dark:text-orange-400">
                        <UserIcon className="h-10 w-10" />
                      </div>
                      <span className="flex flex-1 items-center gap-2 text-sm font-black text-orange-600 dark:text-orange-300">
                        <CloudArrowUpIcon className="h-5 w-5" />
                        Arrastrar imagen o seleccionar archivo
                      </span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    id="photo_url"
                    name="photo_url"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                    disabled={isSubmitting}
                  />
                </label>
                {fileError ? (
                  <span className="mt-2 block text-xs font-bold text-rose-600 dark:text-rose-300">
                    {fileError}
                  </span>
                ) : (
                  <span className="mt-2 block text-xs text-slate-400 dark:text-slate-500">
                    Opcional · Máximo 5 MB · JPG, PNG o similar
                  </span>
                )}
              </div>
            ) : null}

            {successMessage ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircleIcon className="h-5 w-5" />
                {successMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
              {hasFormChanges ? (
                <button
                  type="button"
                  onClick={clearForm}
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
                disabled={!!fileError || !hasFormChanges}
                className="h-11 w-full rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-orange-500/20 sm:w-fit"
              >
                Guardar cambios
              </LoadingButton>
            </div>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                <IdentificationIcon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-950 dark:text-white">
                  Datos de cliente
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Estos datos se usan para identificar tu cuenta y acompañar tus
                  pedidos.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                <PhotoIcon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-950 dark:text-white">
                  Foto de perfil
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  La imagen ayuda a reconocer tu cuenta dentro del sistema.
                </p>
              </div>
            </div>
            <Link
              href={backHref}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-700 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
            >
              Ir a mi cuenta
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
