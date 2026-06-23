"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { useAsyncData } from "@/hooks/shared/use-async-data";
import {
  getRestaurantCoverPhotoUrl,
  setRestaurantCoverPhoto,
} from "@/services/restaurant/photo-service";
import { getCurrentSession } from "@/services/shared/auth-service";

export default function RestaurantCoverPhotoSection() {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [currentCoverUrl, setCurrentCoverUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const uploadPreviewUrl = useMemo(
    () => (uploadFile ? URL.createObjectURL(uploadFile) : ""),
    [uploadFile],
  );

  useEffect(() => {
    return () => {
      if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
    };
  }, [uploadPreviewUrl]);

  const loadCoverPhoto = useCallback(async () => {
    const session = await getCurrentSession();
    if (!session?.idTipoUsuario) {
      throw new Error("No se pudo obtener el ID del local.");
    }

    return {
      currentCoverUrl: await getRestaurantCoverPhotoUrl(session.idTipoUsuario),
      restaurantId: session.idTipoUsuario,
    };
  }, []);

  const { data, error, isLoading, reload } = useAsyncData(loadCoverPhoto, {
    onSuccess: (result) => {
      setCurrentCoverUrl(result.currentCoverUrl);
    },
  });

  function clearUploadFile() {
    setUploadFile(null);
    if (uploadInputRef.current) uploadInputRef.current.value = "";
  }

  function selectUploadFile(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSaveError("Selecciona un archivo de imagen valido.");
      clearUploadFile();
      return;
    }

    setUploadFile(file);
    setSaveError(null);
    setSuccessMessage(null);
  }

  async function saveCoverPhoto() {
    if (!data || !uploadFile) return;

    setIsSaving(true);
    setSaveError(null);
    setSuccessMessage(null);

    try {
      await setRestaurantCoverPhoto(data.restaurantId, { file: uploadFile });
      const nextCoverUrl = await getRestaurantCoverPhotoUrl(data.restaurantId);

      setCurrentCoverUrl(nextCoverUrl);
      clearUploadFile();
      setSuccessMessage("La foto de portada se actualizo correctamente.");
    } catch (savePhotoError) {
      setSaveError(
        savePhotoError instanceof Error
          ? savePhotoError.message
          : "No se pudo actualizar la foto de portada.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const hasChanges = uploadFile != null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-orange-50 p-2.5 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300">
            <PhotoIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-black text-slate-900 dark:text-white">
              Foto de portada
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Actualiza la imagen principal que ven los clientes en tu local.
              La foto de perfil se administra por separado en Mis datos.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
            <div className="aspect-[16/9] animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="aspect-[16/9] animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
            <p className="text-sm font-medium text-red-600 dark:text-red-300">
              {error.message}
            </p>
            <button
              type="button"
              onClick={reload}
              className="mt-3 text-sm font-bold text-red-700 underline underline-offset-4 dark:text-red-200"
            >
              Reintentar
            </button>
          </div>
        ) : data ? (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="relative aspect-[16/9]">
                  {currentCoverUrl ? (
                    <Image
                      src={currentCoverUrl}
                      alt="Foto de portada actual"
                      fill
                      sizes="(min-width: 1024px) 55vw, 90vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center text-slate-500 dark:text-slate-400">
                      <PhotoIcon className="h-9 w-9 text-orange-600 dark:text-orange-300" />
                      <p className="text-sm font-black">
                        Todavia no hay portada guardada
                      </p>
                      <p className="text-xs font-semibold">
                        Subi una imagen para destacarla en el perfil del local.
                      </p>
                    </div>
                  )}
                  {currentCoverUrl ? (
                    <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-black text-slate-800 shadow-sm">
                      Portada actual
                    </span>
                  ) : null}
                </div>
              </div>

              <label
                className={`group relative flex aspect-[16/9] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-900 ${
                  uploadFile
                    ? "border-orange-600 shadow-md"
                    : "border-slate-300 bg-slate-50 hover:border-orange-400 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-orange-600"
                }`}
              >
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => selectUploadFile(event.target.files?.[0])}
                />
                {uploadPreviewUrl ? (
                  <>
                    <Image
                      src={uploadPreviewUrl}
                      alt="Vista previa de la nueva portada"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-black text-slate-800 shadow-sm">
                      Nueva portada
                    </span>
                    <CheckCircleIcon className="absolute right-3 top-3 h-7 w-7 rounded-full bg-white text-orange-600 shadow-sm" />
                  </>
                ) : (
                  <span className="flex flex-col items-center gap-2 px-4 text-center text-slate-500 dark:text-slate-400">
                    <ArrowUpTrayIcon className="h-7 w-7 text-orange-600 dark:text-orange-300" />
                    <span className="text-sm font-black">Subir portada</span>
                    <span className="text-xs">
                      Selecciona una imagen desde tu equipo
                    </span>
                  </span>
                )}
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div aria-live="polite" className="min-h-5 text-sm font-medium">
                {saveError ? (
                  <span className="text-red-600 dark:text-red-300">
                    {saveError}
                  </span>
                ) : successMessage ? (
                  <span className="text-emerald-700 dark:text-emerald-300">
                    {successMessage}
                  </span>
                ) : uploadFile ? (
                  <span className="text-slate-500 dark:text-slate-400">
                    {uploadFile.name}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {uploadFile ? (
                  <button
                    type="button"
                    onClick={() => {
                      clearUploadFile();
                      setSaveError(null);
                      setSuccessMessage(null);
                    }}
                    disabled={isSaving}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Quitar
                  </button>
                ) : null}

                <button
                  type="button"
                  disabled={!hasChanges || isSaving}
                  onClick={saveCoverPhoto}
                  className="h-10 rounded-xl bg-orange-700 px-5 text-sm font-black text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? "Guardando..." : "Guardar portada"}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
