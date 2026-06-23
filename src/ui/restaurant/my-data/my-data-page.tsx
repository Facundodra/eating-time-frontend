"use client";

import {
  ArrowUpTrayIcon,
  CameraIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  KeyIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getRestaurantCoverPhotoUrl,
  setRestaurantCoverPhoto,
} from "@/services/restaurant/photo-service";
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
  const mobileCoverInputRef = useRef<HTMLInputElement>(null);
  const desktopCoverInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fileError, setFileError] = useState("");
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [currentDesktopCoverUrl, setCurrentDesktopCoverUrl] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [mobileCoverPhoto, setMobileCoverPhoto] = useState<File | null>(null);
  const [desktopCoverPhoto, setDesktopCoverPhoto] = useState<File | null>(null);
  const [initialFormData, setInitialFormData] = useState<InitialFormData>({
    name: "",
    phone: "",
  });

  const profilePreviewUrl = useMemo(
    () => (profilePhoto ? URL.createObjectURL(profilePhoto) : null),
    [profilePhoto],
  );
  const mobileCoverPreviewUrl = useMemo(
    () => (mobileCoverPhoto ? URL.createObjectURL(mobileCoverPhoto) : ""),
    [mobileCoverPhoto],
  );
  const desktopCoverPreviewUrl = useMemo(
    () => (desktopCoverPhoto ? URL.createObjectURL(desktopCoverPhoto) : ""),
    [desktopCoverPhoto],
  );
  const displayPhotoUrl = profilePreviewUrl ?? currentPhotoUrl;
  const displayDesktopCoverUrl =
    desktopCoverPreviewUrl || currentDesktopCoverUrl;
  const savedPhotoUrl = currentPhotoUrl;
  const hasFormChanges =
    name !== initialFormData.name ||
    phone !== initialFormData.phone ||
    profilePhoto !== null ||
    mobileCoverPhoto !== null ||
    desktopCoverPhoto !== null;

  useEffect(() => {
    return () => {
      if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
    };
  }, [profilePreviewUrl]);

  useEffect(() => {
    return () => {
      if (mobileCoverPreviewUrl) URL.revokeObjectURL(mobileCoverPreviewUrl);
    };
  }, [mobileCoverPreviewUrl]);

  useEffect(() => {
    return () => {
      if (desktopCoverPreviewUrl) URL.revokeObjectURL(desktopCoverPreviewUrl);
    };
  }, [desktopCoverPreviewUrl]);

  const loadSession = useCallback(async (cancelled: () => boolean) => {
    const session = await getCurrentSession();
    if (cancelled()) return;
    if (!session) return;

    const sessionName = session.nombre ?? "";
    const sessionPhone = session.telefono ?? "";

    setName(sessionName);
    setEmail(session.correo ?? session.email ?? "");
    setPhone(sessionPhone);
    setCurrentPhotoUrl(session.urlFoto ?? null);
    setRestaurantId(session.idTipoUsuario ?? null);
    setInitialFormData({
      name: sessionName,
      phone: sessionPhone,
    });

    if (!session.idTipoUsuario) return;

    const coverUrl = await getRestaurantCoverPhotoUrl(session.idTipoUsuario);
    if (!cancelled()) setCurrentDesktopCoverUrl(coverUrl);
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
              : "No se pudieron cargar los datos del local.",
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

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    selectProfilePhoto(event.dataTransfer.files[0]);
  }

  function removeProfilePhoto() {
    setProfilePhoto(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeCoverPhoto(variant: "mobile" | "desktop") {
    if (variant === "mobile") {
      setMobileCoverPhoto(null);
      if (mobileCoverInputRef.current) mobileCoverInputRef.current.value = "";
    } else {
      setDesktopCoverPhoto(null);
      if (desktopCoverInputRef.current) desktopCoverInputRef.current.value = "";
    }

    setErrorMessage("");
    setSuccessMessage("");
  }

  function selectCoverPhoto(
    file: File | undefined,
    variant: "mobile" | "desktop",
  ) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Solo se permiten imagenes para las portadas.");
      if (variant === "mobile" && mobileCoverInputRef.current) {
        mobileCoverInputRef.current.value = "";
      }
      if (variant === "desktop" && desktopCoverInputRef.current) {
        desktopCoverInputRef.current.value = "";
      }
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("Las portadas no pueden superar los 5MB.");
      if (variant === "mobile" && mobileCoverInputRef.current) {
        mobileCoverInputRef.current.value = "";
      }
      if (variant === "desktop" && desktopCoverInputRef.current) {
        desktopCoverInputRef.current.value = "";
      }
      return;
    }

    if (variant === "mobile") {
      setMobileCoverPhoto(file);
    } else {
      setDesktopCoverPhoto(file);
    }
    setSuccessMessage("");
    setErrorMessage("");
  }

  function cancelChanges() {
    setName(initialFormData.name);
    setPhone(initialFormData.phone);
    setProfilePhoto(null);
    setMobileCoverPhoto(null);
    setDesktopCoverPhoto(null);
    setFileError("");
    setSuccessMessage("");
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (mobileCoverInputRef.current) mobileCoverInputRef.current.value = "";
    if (desktopCoverInputRef.current) desktopCoverInputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const nextName = name.trim();
      const nextPhone = phone.trim();
      let didSaveDesktopCover = false;

      if (
        nextName !== initialFormData.name ||
        nextPhone !== initialFormData.phone ||
        profilePhoto !== null
      ) {
        await editUserData(nextName, nextPhone, profilePhoto);
      }

      if (desktopCoverPhoto && !restaurantId) {
        throw new Error("No se pudo obtener el ID del local.");
      }

      if (desktopCoverPhoto && restaurantId) {
        await setRestaurantCoverPhoto(restaurantId, { file: desktopCoverPhoto });
        didSaveDesktopCover = true;
      }

      const updatedSession = await getCurrentSession();
      const nextPhotoUrl = updatedSession?.urlFoto ?? currentPhotoUrl;
      const nextDesktopCoverUrl =
        didSaveDesktopCover && restaurantId
          ? await getRestaurantCoverPhotoUrl(restaurantId)
          : currentDesktopCoverUrl;

      setSuccessMessage(
        mobileCoverPhoto
          ? didSaveDesktopCover
            ? "Se guardaron los datos del local y la portada desktop. La portada mobile quedara disponible cuando backend exponga el endpoint."
            : "Se guardaron los datos del local. La portada mobile quedara disponible cuando backend exponga el endpoint."
          : didSaveDesktopCover
            ? "Se guardaron los datos del local y la portada desktop."
          : "Los datos del local se actualizaron correctamente.",
      );
      setCurrentPhotoUrl(nextPhotoUrl);
      setCurrentDesktopCoverUrl(nextDesktopCoverUrl);
      setEmail(updatedSession?.correo ?? updatedSession?.email ?? email);
      setName(nextName);
      setPhone(nextPhone);
      setInitialFormData({
        name: nextName,
        phone: nextPhone,
      });
      setProfilePhoto(null);
      setMobileCoverPhoto(null);
      setDesktopCoverPhoto(null);
      if (mobileCoverInputRef.current) mobileCoverInputRef.current.value = "";
      if (desktopCoverInputRef.current) desktopCoverInputRef.current.value = "";
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
              Actualiza la informacion visible del local, su foto de perfil y la
              portada.
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

                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-start gap-3">
                    <span className="rounded-xl bg-orange-50 p-2.5 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300">
                      <PhotoIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="font-black text-slate-900 dark:text-white">
                        Fotos del local
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Administra la foto de perfil y las portadas mobile y desktop
                        del local.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(16rem,1fr)_minmax(12rem,0.75fr)_minmax(20rem,1.4fr)]">
                    <div className="w-full xl:mx-auto xl:max-w-64">
                      <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                        Foto de perfil
                      </span>
                      <label
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={handleDrop}
                        className="group relative mx-auto flex h-56 w-56 max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center transition focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2 hover:border-orange-400 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-orange-600 dark:focus-within:ring-offset-slate-900 sm:h-64 sm:w-64 xl:h-64 xl:w-full"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                        {displayPhotoUrl ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={displayPhotoUrl}
                              alt="Foto del local"
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-white/95 px-2.5 py-1 text-xs font-black text-slate-800 shadow-sm">
                              {profilePhoto ? "Foto nueva" : "Foto actual"}
                            </span>
                          </>
                        ) : (
                          <span className="flex flex-col items-center gap-2 px-4 text-center text-slate-500 dark:text-slate-400">
                            <CloudArrowUpIcon className="h-7 w-7 text-orange-600 dark:text-orange-300" />
                            <span className="text-sm font-black">
                              Subir foto de perfil
                            </span>
                            <span className="text-xs">
                              Selecciona una imagen desde tu equipo
                            </span>
                          </span>
                        )}
                      </label>
                      <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Recomendado: imagen cuadrada. Maximo 5MB.
                      </p>
                      {profilePhoto ? (
                        <button
                          type="button"
                          onClick={removeProfilePhoto}
                          className="mx-auto mt-2 flex h-9 items-center justify-center rounded-xl bg-white px-3 text-xs font-extrabold text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-orange-600 hover:text-white dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800"
                        >
                          Quitar foto
                        </button>
                      ) : null}
                      {fileError ? (
                        <p className="mt-2 text-xs font-bold text-red-500">
                          {fileError}
                        </p>
                      ) : null}
                    </div>

                    <div className="w-full xl:mx-auto xl:max-w-48">
                          <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                            Portada mobile
                          </span>
                          <label className="group relative mx-auto flex h-56 w-[10.5rem] max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2 hover:border-orange-400 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-orange-600 dark:focus-within:ring-offset-slate-900 sm:h-64 sm:w-48 xl:h-64 xl:w-full">
                            <input
                              ref={mobileCoverInputRef}
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(event) =>
                                selectCoverPhoto(event.target.files?.[0], "mobile")
                              }
                            />
                            {mobileCoverPreviewUrl ? (
                              <>
                                <Image
                                  src={mobileCoverPreviewUrl}
                                  alt="Vista previa de la portada mobile"
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                                <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-black text-slate-800 shadow-sm">
                                  Portada mobile
                                </span>
                              </>
                            ) : (
                              <span className="flex flex-col items-center gap-2 px-4 text-center text-slate-500 dark:text-slate-400">
                                <ArrowUpTrayIcon className="h-7 w-7 text-orange-600 dark:text-orange-300" />
                                <span className="text-sm font-black">
                                  Subir portada mobile
                                </span>
                                <span className="text-xs">
                                  Selecciona una imagen desde tu equipo
                                </span>
                              </span>
                            )}
                          </label>
                          <p className="mt-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Recomendado para telefono: 1080 x 1920 px.
                          </p>
                          {mobileCoverPhoto ? (
                            <button
                              type="button"
                              onClick={() => removeCoverPhoto("mobile")}
                              className="mx-auto mt-2 flex h-9 items-center justify-center rounded-xl bg-white px-3 text-xs font-extrabold text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-orange-600 hover:text-white dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800"
                            >
                              Quitar foto
                            </button>
                          ) : null}
                    </div>

                    <div className="w-full">
                          <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                            Portada computadora
                          </span>
                          <label className="group relative flex h-44 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2 hover:border-orange-400 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-orange-600 dark:focus-within:ring-offset-slate-900 sm:h-56 md:h-64 xl:h-64">
                            <input
                              ref={desktopCoverInputRef}
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(event) =>
                                selectCoverPhoto(event.target.files?.[0], "desktop")
                              }
                            />
                            {displayDesktopCoverUrl ? (
                              <>
                                <Image
                                  src={displayDesktopCoverUrl}
                                  alt={
                                    desktopCoverPhoto
                                      ? "Vista previa de la portada computadora"
                                      : "Portada computadora actual"
                                  }
                                  fill
                                  unoptimized={Boolean(desktopCoverPreviewUrl)}
                                  className="object-cover"
                                />
                                <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-black text-slate-800 shadow-sm">
                                  {desktopCoverPhoto
                                    ? "Portada desktop nueva"
                                    : "Portada desktop actual"}
                                </span>
                              </>
                            ) : (
                              <span className="flex flex-col items-center gap-2 px-4 text-center text-slate-500 dark:text-slate-400">
                                <ArrowUpTrayIcon className="h-7 w-7 text-orange-600 dark:text-orange-300" />
                                <span className="text-sm font-black">
                                  Subir portada desktop
                                </span>
                                <span className="text-xs">
                                  Selecciona una imagen desde tu equipo
                                </span>
                              </span>
                            )}
                          </label>
                          <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Recomendado: imagen horizontal de 1920 x 1080 px.
                          </p>
                          {desktopCoverPhoto ? (
                            <button
                              type="button"
                              onClick={() => removeCoverPhoto("desktop")}
                              className="mx-auto mt-2 flex h-9 items-center justify-center rounded-xl bg-white px-3 text-xs font-extrabold text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-orange-600 hover:text-white dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800"
                            >
                              Quitar foto
                            </button>
                          ) : null}
                    </div>
                  </div>
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
