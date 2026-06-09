"use client";

import { FormEvent, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

import type { Order, OrderRating, OrderRatingValue } from "@/lib/client/types";
import { submitOrderLocalRating } from "@/services/client/client-service";

type OrderRatingModalProps = {
  onClose: () => void;
  onSaved: (rating: OrderRating) => void;
  order: Order;
};

const ratingOptions: Array<{
  label: string;
  level: number;
  value: OrderRatingValue;
}> = [
  { label: "1", level: 1, value: "1_ESTRELLA" },
  { label: "2", level: 2, value: "2_ESTRELLAS" },
  { label: "3", level: 3, value: "3_ESTRELLAS" },
  { label: "4", level: 4, value: "4_ESTRELLAS" },
  { label: "5", level: 5, value: "5_ESTRELLAS" },
];

function getRatingLevel(value?: string | null) {
  if (!value) return 0;

  const firstDigit = Number(value.charAt(0));
  return Number.isFinite(firstDigit) ? firstDigit : 0;
}

function getRatingValue(level: number): OrderRatingValue {
  return ratingOptions.find((option) => option.level === level)?.value ?? "5_ESTRELLAS";
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  return date.toLocaleString("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderRatingModal({
  onClose,
  onSaved,
  order,
}: OrderRatingModalProps) {
  const savedRating = order.calificacionLocal;
  const isReadOnly = Boolean(savedRating);
  const [selectedLevel, setSelectedLevel] = useState(
    getRatingLevel(savedRating?.calificacion),
  );
  const [comment, setComment] = useState(savedRating?.comentario ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const ratingDateLabel = savedRating?.creacion
    ? formatDate(savedRating.creacion)
    : "--/--, --:--";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isReadOnly) {
      onClose();
      return;
    }

    if (!selectedLevel) {
      setSubmitError("Selecciona una calificacion para continuar.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const rating = await submitOrderLocalRating(order.id, {
        calificacion: getRatingValue(selectedLevel),
        comentario: comment,
      });
      onSaved(rating);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No se pudo registrar la calificacion.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <section
        aria-labelledby="order-rating-title"
        aria-modal="true"
        className="w-full max-w-[670px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <p className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500">
                {isReadOnly ? "Calificacion del pedido" : "Calificar pedido"}
              </p>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                {ratingDateLabel}
              </span>
            </div>
            <h2
              className="mt-3 text-xl font-black text-slate-950 dark:text-white"
              id="order-rating-title"
            >
              PED-{order.id}
            </h2>
          </div>

          <button
            aria-label="Cerrar"
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-5 px-6 py-5" onSubmit={handleSubmit}>
          <fieldset disabled={isSubmitting || isReadOnly}>
            <legend className="mb-3 text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Calificacion
            </legend>
            <div className="flex flex-wrap gap-2">
              {ratingOptions.map((option) => {
                const isActive = selectedLevel >= option.level;

                return (
                  <button
                    aria-label={`${option.label} estrellas`}
                    className="rounded-lg p-1 transition enabled:hover:bg-orange-50 disabled:cursor-default dark:enabled:hover:bg-orange-500/10"
                    key={option.value}
                    onClick={() => setSelectedLevel(option.level)}
                    type="button"
                  >
                    <StarIcon
                      className={clsx(
                        "h-9 w-9 transition",
                        isActive
                          ? "text-orange-400"
                          : "text-slate-300 dark:text-slate-700",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Comentario
            </span>
            <textarea
              className="min-h-32 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-950/60 dark:disabled:text-slate-400 dark:focus:ring-orange-500/20"
              disabled={isSubmitting || isReadOnly}
              maxLength={280}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Escribe un comentario sobre el pedido."
              value={comment}
            />
          </label>

          {submitError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {submitError}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
            <button
              className="h-11 rounded-xl border border-gray-200 px-5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              Cerrar
            </button>

            {!isReadOnly ? (
              <button
                className="h-11 rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white shadow-[0_12px_22px_rgba(234,88,12,0.22)] transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!selectedLevel || isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Guardando..." : "Guardar calificacion"}
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
