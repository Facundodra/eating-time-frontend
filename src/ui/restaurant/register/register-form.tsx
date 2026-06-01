"use client";

import {
  BuildingStorefrontIcon,
  CloudArrowUpIcon,
  EnvelopeIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  PhotoIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";

import { registerRestaurantAction } from "@/app/register/restaurant/actions";
import LoadingButton from "@/ui/shared/buttons/loading-button";

const MAX_RAW_FILE_SIZE = 15 * 1024 * 1024;
const MAX_PHOTOS = 5;
const RESIZE_MAX_WIDTH = 1200;
const RESIZE_QUALITY = 0.82;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function isAcceptedImage(file: File) {
  return (
    ACCEPTED_IMAGE_TYPES.has(file.type) ||
    /\.(jpe?g|png|webp)$/i.test(file.name)
  );
}

function resizeImage(file: File): Promise<File> {   // aca comprimimo (en el front) antes de mandar al back. 
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const scale = Math.min(1, RESIZE_MAX_WIDTH / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const outputName = file.name.replace(/\.[^.]+$/, ".jpg");
          resolve(new File([blob], outputName, { type: "image/jpeg" }));
        },
        "image/jpeg",
        RESIZE_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

type PhotoThumbProps = Readonly<{
  file: File;
  onRemove: () => void;
}>;

function PhotoThumb({
  file,
  onRemove,
}: PhotoThumbProps) {
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  return (
    <div className="relative h-[72px] w-[72px] overflow-hidden rounded-[10px] border border-gray-200 dark:border-slate-700">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={file.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-50 dark:bg-slate-800">
          <PhotoIcon className="h-6 w-6 text-slate-300" />
        </div>
      )}
      <button
        type="button"
        aria-label={`Eliminar ${file.name}`}
        onClick={onRemove}
        className="absolute right-1 top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-slate-900/70 text-white transition hover:bg-orange-600"
      >
        <XMarkIcon className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

export default function RegisterForm() {
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    let error: string | null = null;
    const toProcess: File[] = [];

    for (const file of incoming) {
      if (!isAcceptedImage(file)) {
        error = "Solo se permiten imágenes PNG, JPG o WEBP";
        continue;
      }
      if (file.size > MAX_RAW_FILE_SIZE) {
        error = "Cada imagen no puede superar los 15 MB";
        continue;
      }
      toProcess.push(file);
    }

    if (toProcess.length === 0) {
      setPhotoError(error);
      return;
    }

    setIsProcessingPhotos(true);
    setPhotoError(null);

    const compressed = await Promise.all(toProcess.map(resizeImage));

    setPhotos((current) => {
      const existingNames = new Set(current.map((f) => f.name));
      const merged = [...current];
      for (const file of compressed) {
        if (!existingNames.has(file.name)) {
          merged.push(file);
          existingNames.add(file.name);
        }
      }
      if (merged.length > MAX_PHOTOS) {
        error = `Podés subir hasta ${MAX_PHOTOS} fotos`;
        return merged.slice(0, MAX_PHOTOS);
      }
      return merged;
    });

    setIsProcessingPhotos(false);
    if (error) setPhotoError(error);
  }, []);

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      void addFiles(event.target.files);
    }
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    if (event.dataTransfer.files.length > 0) {
      void addFiles(event.dataTransfer.files);
    }
  }

  function removePhoto(index: number) {
    setPhotos((current) => current.filter((_, i) => i !== index));
    setPhotoError(null);
  }

  async function handleSubmit(
    event: { preventDefault(): void; currentTarget: HTMLFormElement },
  ): Promise<void> {
    event.preventDefault();
    setSubmitError(null);

    if (photos.length === 0) {
      setPhotoError("Debés subir al menos una foto de referencia");
      return;
    }

    setPhotoError(null);

    const formData = new FormData(event.currentTarget);
    const nombre = ((formData.get("nombre") as string | null) ?? "").trim();
    const descripcion = ((formData.get("descripcion") as string | null) ?? "").trim();
    const email = ((formData.get("email") as string | null) ?? "").trim();
    const direccion = ((formData.get("direccion") as string | null) ?? "").trim();
    const telefono = ((formData.get("telefono") as string | null) ?? "").trim();

    if (!nombre) {
      setSubmitError("El nombre del local es obligatorio");
      return;
    }
    if (!descripcion) {
      setSubmitError("La descripción es obligatoria");
      return;
    }
    if (!email) {
      setSubmitError("El correo electrónico es obligatorio");
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setSubmitError("Correo electrónico inválido");
      return;
    }
    if (!telefono) {
      setSubmitError("El teléfono es obligatorio");
      return;
    }
    if (!direccion) {
      setSubmitError("La dirección es obligatoria");
      return;
    }

    setIsSubmitting(true);

    try {
      for (const photo of photos) {
        formData.append("fotos", photo);
      }

      const result = await registerRestaurantAction(null, formData);

      if (result?.error) {
        setSubmitError(result.error);
        return;
      }

      setIsSuccess(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No se pudo enviar la solicitud. Intentalo nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="mx-auto w-full max-w-[700px] rounded-[18px] border border-gray-200 bg-white px-9 py-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center py-6 text-center">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
            <svg
              className="h-7 w-7 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            ¡Solicitud enviada!
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            Recibimos tu solicitud de registro. Nuestro equipo la revisará y te
            notificaremos por correo electrónico con la resolución.
          </p>
          <Link
            href="/login"
            className="btn-secondary mt-8 flex items-center justify-center !w-auto px-8"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[700px] rounded-[18px] border border-gray-200 bg-white px-6 py-8 shadow-sm sm:px-9 sm:py-10 dark:border-slate-800 dark:bg-slate-900">
      <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-500/15 dark:text-orange-300">
        <BuildingStorefrontIcon className="h-3.5 w-3.5" aria-hidden />
        Registro de local
      </div>
      <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
        Sumá tu local a Eating Time
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
        Completá el formulario con los datos de tu negocio. Una vez enviado,
        nuestro equipo revisará tu solicitud y te avisaremos por email.
      </p>

      <div className="my-6 h-px bg-gray-100 dark:bg-slate-800" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <section>
          <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            <BuildingStorefrontIcon
              className="h-4 w-4 text-orange-600"
              aria-hidden
            />
            Información del local
          </p>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="nombre"
                className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Nombre del local <span className="text-orange-600">*</span>
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                autoComplete="organization"
                placeholder="Ej: Pizzería Don Pepe"
                className="field"
                required
              />
            </div>

            <div>
              <label
                htmlFor="descripcion"
                className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Descripción detallada{" "}
                <span className="text-orange-600">*</span>
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={4}
                placeholder="Contanos qué hace especial a tu local: especialidad, estilo de cocina, años de experiencia..."
                className="field !h-auto min-h-[96px] resize-y py-3"
                required
              />
            </div>
          </div>
        </section>

        <div className="h-px bg-gray-100 dark:bg-slate-800" />

        <section>
          <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            <PhotoIcon className="h-4 w-4 text-orange-600" aria-hidden />
            Fotos de referencia
          </p>

          <div className="mb-4 flex gap-2 rounded-xl bg-orange-50 px-3.5 py-3 text-sm leading-relaxed text-orange-900/80 dark:bg-orange-500/10 dark:text-orange-200/90">
            <PhotoIcon
              className="mt-0.5 h-4 w-4 shrink-0 text-orange-600"
              aria-hidden
            />
            <p>
              Subí fotos de tu local o de tus platos. Ayudan al equipo
              a revisar tu solicitud.
            </p>
          </div>

          <button
            type="button"
            disabled={isProcessingPhotos}
            onDragOver={(event) => event.preventDefault()}
            onDrop={isProcessingPhotos ? undefined : handleDrop}
            onClick={() => !isProcessingPhotos && fileInputRef.current?.click()}
            className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-6 text-center transition ${
              isProcessingPhotos
                ? "cursor-wait border-orange-300 bg-orange-50/40 dark:border-orange-500/30 dark:bg-orange-500/5"
                : "cursor-pointer border-gray-200 bg-gray-50 hover:border-orange-500 hover:bg-orange-50/50 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-orange-500/60 dark:hover:bg-orange-500/5"
            }`}
          >
            {isProcessingPhotos ? (
              <>
                <span className="h-7 w-7 animate-spin rounded-full border-2 border-orange-300 border-t-orange-600" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Procesando imágenes...
                </span>
              </>
            ) : (
              <>
                <CloudArrowUpIcon
                  className="h-8 w-8 text-slate-300 dark:text-slate-600"
                  aria-hidden
                />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Arrastrá tus fotos acá
                </span>
                <span className="text-xs text-slate-400">
                  PNG, JPG o WEBP · Se comprimen automáticamente · Hasta {MAX_PHOTOS} fotos
                </span>
                <span className="mt-1 rounded-full bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white">
                  Seleccionar archivos
                </span>
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            id="fotos"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            disabled={isProcessingPhotos}
            className="sr-only"
            onChange={handleFileInputChange}
          />

          {photos.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2.5">
              {photos.map((file, index) => (
                <PhotoThumb
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  file={file}
                  onRemove={() => removePhoto(index)}
                />
              ))}
              <button
                type="button"
                aria-label="Agregar foto"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-[72px] w-[72px] items-center justify-center rounded-[10px] border border-dashed border-gray-200 bg-gray-50 transition hover:border-orange-500 hover:bg-orange-50/50 dark:border-slate-700 dark:bg-slate-950/40"
              >
                <PlusIcon className="h-6 w-6 text-slate-300" />
              </button>
            </div>
          ) : null}

          {photoError ? (
            <p className="mt-2 text-xs font-medium text-red-600">{photoError}</p>
          ) : null}
        </section>

        <div className="h-px bg-gray-100 dark:bg-slate-800" />

        <section>
          <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            <MapPinIcon className="h-4 w-4 text-orange-600" aria-hidden />
            Contacto y ubicación
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Correo electrónico <span className="text-orange-600">*</span>
              </label>
              <div className="relative">
                <EnvelopeIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="local@ejemplo.com"
                  className="field !pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="telefono"
                className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Teléfono <span className="text-orange-600">*</span>
              </label>
              <div className="relative">
                <PhoneIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="099 000 000"
                  className="field !pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="direccion"
              className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              Domicilio <span className="text-orange-600">*</span>
            </label>
            <div className="relative">
              <MapPinIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
              <input
                id="direccion"
                name="direccion"
                type="text"
                autoComplete="street-address"
                placeholder="Av. 18 de Julio 1234, Montevideo"
                className="field !pl-10"
                required
              />
            </div>
          </div>
        </section>

        {submitError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-col gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ¿Ya tenés cuenta?{" "}
            <Link
              href="/login"
              className="font-semibold text-orange-600 hover:text-orange-700"
            >
              Iniciá sesión
            </Link>
          </p>
          <LoadingButton
            type="submit"
            isLoading={isSubmitting}
            loadingText="Enviando..."
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-orange-600 px-7 text-sm font-bold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-4 w-4" aria-hidden />
            Enviar solicitud
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
