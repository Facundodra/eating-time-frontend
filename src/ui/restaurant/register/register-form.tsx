"use client";

import {
  CloudArrowUpIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
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

import { enviarSolicitudRegistroRestaurant } from "@/services/admin/gestion-service";
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

function resizeImage(file: File): Promise<File> {
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

function PhotoThumb({ file, onRemove }: PhotoThumbProps) {
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  return (
    <div className="relative h-[72px] w-[96px] overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt={file.name}
        className="h-full w-full object-cover"
      />
      <button
        type="button"
        aria-label={`Eliminar ${file.name}`}
        onClick={onRemove}
        className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/70 text-white transition hover:bg-orange-600"
      >
        <XMarkIcon className="h-3 w-3" />
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
      const existingNames = new Set(current.map((file) => file.name));
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

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
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
    setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setPhotoError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (photos.length === 0) {
      setPhotoError("Debés subir al menos una foto de referencia");
      return;
    }

    setPhotoError(null);

    const formData = new FormData(event.currentTarget);
    const nombre = String(formData.get("nombre") ?? "").trim();
    const descripcion = String(formData.get("descripcion") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const direccion = String(formData.get("direccion") ?? "").trim();
    const telefono = String(formData.get("telefono") ?? "").trim();

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
      await enviarSolicitudRegistroRestaurant({
        nombre,
        descripcion,
        email,
        direccion,
        telefono,
        fotos: photos,
      });

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
      <div className="rounded-[18px] border border-gray-200 bg-white px-8 py-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
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
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          ¡Solicitud enviada!
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          Recibimos tu solicitud de registro. Nuestro equipo la revisará y te
          notificaremos por correo electrónico con la resolución.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-orange-600 px-7 text-sm font-black text-white transition hover:bg-orange-700"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-gray-100 px-5 py-5 dark:border-slate-800 sm:px-6">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          Datos del local
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Estos datos serán evaluados antes de habilitar el acceso al panel.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-black text-slate-700 dark:text-slate-300">
              Nombre del local
            </span>
            <input
              id="nombre"
              name="nombre"
              type="text"
              autoComplete="organization"
              placeholder="La Pasta Nostra"
              className="field"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black text-slate-700 dark:text-slate-300">
              Correo electrónico
            </span>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="local@eatingtime.uy"
              className="field"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black text-slate-700 dark:text-slate-300">
              Teléfono
            </span>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="099 123 456"
              className="field"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black text-slate-700 dark:text-slate-300">
              Dirección
            </span>
            <input
              id="direccion"
              name="direccion"
              type="text"
              autoComplete="street-address"
              placeholder="Bulevar España 1234"
              className="field"
              required
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-black text-slate-700 dark:text-slate-300">
            Descripción
          </span>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={4}
            placeholder="Local de comida italiana artesanal, especializado en pastas frescas, minutas y postres clásicos."
            className="field !h-auto min-h-[110px] resize-y py-3"
            required
          />
        </label>

        <section>
          <div>
            <p className="text-xs font-black text-slate-700 dark:text-slate-300">
              Fotos de referencia
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
              Cuantas más fotos variadas agregues, mejor ayudan al administrador
              a evaluar el local con más contexto.
            </p>
          </div>

          {photos.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2.5">
              {photos.map((file, index) => (
                <PhotoThumb
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  file={file}
                  onRemove={() => removePhoto(index)}
                />
              ))}
            </div>
          ) : null}

          <button
            type="button"
            disabled={isProcessingPhotos}
            onDragOver={(event) => event.preventDefault()}
            onDrop={isProcessingPhotos ? undefined : handleDrop}
            onClick={() => !isProcessingPhotos && fileInputRef.current?.click()}
            className="mt-3 flex w-full items-center justify-center rounded-xl border border-dashed border-orange-300 bg-orange-50 px-5 py-4 text-center text-sm font-black text-orange-600 transition hover:border-orange-500 hover:bg-orange-100 disabled:cursor-wait disabled:opacity-70 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-300 dark:hover:bg-orange-500/20"
          >
            {isProcessingPhotos ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-300 border-t-orange-600" />
                Procesando imágenes...
              </span>
            ) : photos.length > 0 ? (
              <span className="flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                Agregar foto
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CloudArrowUpIcon className="h-5 w-5" />
                Arrastrar imágenes o seleccionar archivos
              </span>
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

          {photoError ? (
            <p className="mt-2 text-xs font-semibold text-red-600">
              {photoError}
            </p>
          ) : null}
        </section>

        {submitError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-col gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ¿Ya tienes una cuenta?{" "}
            <Link
              href="/login"
              className="font-semibold text-orange-600 hover:text-orange-700"
            >
              Inicia sesión
            </Link>
          </p>
          <LoadingButton
            type="submit"
            isLoading={isSubmitting}
            loadingText="Enviando..."
            className="btn-secondary inline-flex !w-auto min-w-[180px] items-center justify-center px-6 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enviar solicitud
          </LoadingButton>
        </div>
      </form>
    </section>
  );
}
