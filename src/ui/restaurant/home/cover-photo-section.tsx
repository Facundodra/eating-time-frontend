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
} from "@heroicons/react/24/outline";

import { useAsyncData } from "@/hooks/shared/use-async-data";
import {
  getRestaurantReferencePhotos,
  setRestaurantCoverPhoto,
} from "@/services/restaurant/photo-service";
import { getCurrentSession } from "@/services/shared/auth-service";

function normalizeUrl(url: string | null | undefined) {
  return url?.trim().replace(/\/$/, "") ?? "";
}

export default function RestaurantCoverPhotoSection() {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);
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

  const loadPhotos = useCallback(async () => {
    const session = await getCurrentSession();
    if (!session?.idTipoUsuario) {
      throw new Error("No se pudo obtener el ID del local.");
    }

    const photos = await getRestaurantReferencePhotos(session.idTipoUsuario);
    return {
      currentCoverUrl:
        session.urlPortada ?? session.urlFotoPortada ?? "",
      photos,
      restaurantId: session.idTipoUsuario,
    };
  }, []);

  const { data, error, isLoading, reload } = useAsyncData(loadPhotos, {
    onSuccess: (result) => {
      const coverUrl = normalizeUrl(result.currentCoverUrl);
      const currentPhoto = result.photos.find(
        (photo) => normalizeUrl(photo.url) === coverUrl,
      );

      setCurrentCoverUrl(result.currentCoverUrl);
      setSelectedPhotoId(currentPhoto?.id ?? null);
    },
  });

  function selectReferencePhoto(photoId: number) {
    setSelectedPhotoId(photoId);
    setUploadFile(null);
    setSaveError(null);
    setSuccessMessage(null);
    if (uploadInputRef.current) uploadInputRef.current.value = "";
  }

  function selectUploadFile(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSaveError("Seleccioná un archivo de imagen válido.");
      if (uploadInputRef.current) uploadInputRef.current.value = "";
      return;
    }

    setUploadFile(file);
    setSelectedPhotoId(null);
    setSaveError(null);
    setSuccessMessage(null);
  }

  async function saveCoverPhoto() {
    if (!data || (!uploadFile && selectedPhotoId == null)) return;

    const selectedPhoto = data.photos.find(
      (photo) => photo.id === selectedPhotoId,
    );
    if (!uploadFile && !selectedPhoto) return;

    setIsSaving(true);
    setSaveError(null);
    setSuccessMessage(null);

    try {
      await setRestaurantCoverPhoto(
        data.restaurantId,
        uploadFile ? { file: uploadFile } : { photoId: selectedPhoto!.id },
      );

      if (uploadFile) {
        setUploadFile(null);
        setSelectedPhotoId(null);
        if (uploadInputRef.current) uploadInputRef.current.value = "";
        reload();
      } else if (selectedPhoto) {
        setCurrentCoverUrl(selectedPhoto.url);
      }

      setSuccessMessage("La foto de portada se actualizó correctamente.");
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

  const selectedPhoto = data?.photos.find(
    (photo) => photo.id === selectedPhotoId,
  );
  const hasChanges =
    uploadFile != null ||
    (selectedPhoto != null &&
      normalizeUrl(selectedPhoto.url) !== normalizeUrl(currentCoverUrl));

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
              Elegí una foto de referencia o subí una nueva. Tu foto de perfil
              se administra por separado en Mis datos.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[16/9] animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
              />
            ))}
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                      Nueva foto
                    </span>
                    <CheckCircleIcon className="absolute right-3 top-3 h-7 w-7 rounded-full bg-white text-orange-600 shadow-sm" />
                  </>
                ) : (
                  <span className="flex flex-col items-center gap-2 px-4 text-center text-slate-500 dark:text-slate-400">
                    <ArrowUpTrayIcon className="h-7 w-7 text-orange-600 dark:text-orange-300" />
                    <span className="text-sm font-black">Subir nueva foto</span>
                    <span className="text-xs">Seleccioná una imagen desde tu equipo</span>
                  </span>
                )}
              </label>

              {data.photos.map((photo, index) => {
                const isSelected = selectedPhotoId === photo.id && !uploadFile;
                const isCurrent =
                  normalizeUrl(currentCoverUrl) === normalizeUrl(photo.url);

                return (
                  <button
                    key={photo.id}
                    type="button"
                    aria-label={`Seleccionar foto de referencia ${index + 1}`}
                    aria-pressed={isSelected}
                    onClick={() => selectReferencePhoto(photo.id)}
                    className={`group relative aspect-[16/9] overflow-hidden rounded-xl border-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                      isSelected
                        ? "border-orange-600 shadow-md"
                        : "border-transparent hover:border-orange-300 dark:hover:border-orange-700"
                    }`}
                  >
                    <Image
                      src={photo.url}
                      alt={`Foto de referencia ${index + 1}`}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                      className="object-cover transition duration-200 group-hover:scale-[1.02]"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    {isCurrent ? (
                      <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-black text-slate-800 shadow-sm">
                        Portada actual
                      </span>
                    ) : null}
                    {isSelected ? (
                      <CheckCircleIcon className="absolute right-3 top-3 h-7 w-7 rounded-full bg-white text-orange-600 shadow-sm" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {data.photos.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                No hay fotos de la solicitud disponibles. Podés subir una nueva
                para usarla como portada.
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div aria-live="polite" className="min-h-5 text-sm font-medium">
                {saveError ? (
                  <span className="text-red-600 dark:text-red-300">{saveError}</span>
                ) : successMessage ? (
                  <span className="text-emerald-700 dark:text-emerald-300">
                    {successMessage}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                disabled={!hasChanges || isSaving}
                onClick={saveCoverPhoto}
                className="rounded-xl bg-orange-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Guardando..." : "Guardar portada"}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
