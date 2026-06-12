"use client";

import { FormEvent, useState } from "react";
import { StarIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

import type { Order, OrderRating, OrderRatingValue } from "@/lib/client/types";
import { submitOrderLocalRating } from "@/services/client/client-service";

type OrderRatingModalProps = {
  onClose: () => void;
  onSaved: (rating: OrderRating) => void;
  order: Order;
};

const ratingOptions: OrderRatingValue[] = [1, 2, 3, 4, 5];

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

function getRatingLabel(value: OrderRatingValue | null) {
  if (value != null) return `${value} de 5`;
  return "Sin calificación";
}

export default function OrderRatingModal({
  onClose,
  onSaved,
  order,
}: OrderRatingModalProps) {
  const savedRating = order.calificacionLocal;
  const isReadOnly = Boolean(savedRating);
  const [selectedRating, setSelectedRating] = useState<OrderRatingValue | null>(
    savedRating?.calificacion ?? null,
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

    if (selectedRating == null) {
      setSubmitError("Seleccioná una calificación para continuar.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const rating = await submitOrderLocalRating(order.id, {
        calificacion: selectedRating,
        comentario: comment,
      });
      onSaved(rating);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No se pudo registrar la calificación.",
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
        className="w-full max-w-[646px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/25 dark:bg-black"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-white/50">
          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <p className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500">
                {isReadOnly ? "Calificación del pedido" : "Calificar pedido"}
              </p>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                {ratingDateLabel}
              </span>
            </div>
            <h2
              className="mt-3 text-2xl font-black text-slate-950 dark:text-indigo-100"
              id="order-rating-title"
            >
              PED-{order.id}
            </h2>
          </div>

          <button
            aria-label="Cerrar"
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-6 px-6 py-6" onSubmit={handleSubmit}>
          <fieldset disabled={isSubmitting || isReadOnly}>
            <legend className="mb-3 text-sm font-extrabold text-slate-700 dark:text-indigo-100">
              Calificación
            </legend>
            <div className="flex flex-wrap gap-3 sm:gap-5">
              {ratingOptions.map((option) => {
                const isFilled =
                  selectedRating != null && option <= selectedRating;
                const isSelected = selectedRating === option;
                const Icon = isFilled ? StarSolidIcon : StarIcon;

                return (
                  <button
                    aria-pressed={isSelected}
                    aria-label={`${option} de 5`}
                    className={clsx(
                      "grid h-14 w-14 place-items-center rounded-lg transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-default sm:h-[68px] sm:w-[68px] dark:focus-visible:ring-orange-400/30",
                      isFilled
                        ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.28)] dark:text-yellow-300"
                        : "text-slate-300 hover:text-yellow-300 dark:text-zinc-400 dark:hover:text-yellow-300",
                    )}
                    key={option}
                    onClick={() => setSelectedRating(option)}
                    type="button"
                  >
                    <Icon className="h-12 w-12 stroke-[1.6] sm:h-16 sm:w-16" />
                  </button>
                );
              })}
            </div>
            {isReadOnly ? (
              <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Resultado: {getRatingLabel(selectedRating)}
              </p>
            ) : null}
          </fieldset>

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-indigo-100">
              Comentario
            </span>
            <textarea
              className="min-h-32 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:bg-slate-50 disabled:text-slate-500 dark:border-white dark:bg-black dark:text-slate-100 dark:placeholder:text-indigo-100 dark:disabled:bg-black dark:disabled:text-slate-400 dark:focus:border-orange-400 dark:focus:ring-orange-500/20"
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

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end dark:border-white/80">
            <button
              className="h-11 rounded-xl border border-gray-200 px-5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white dark:text-indigo-100 dark:hover:bg-white/10"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              {isReadOnly ? "Cerrar" : "Cancelar"}
            </button>

            {!isReadOnly ? (
              <button
                className="h-11 rounded-xl bg-orange-500 px-5 text-sm font-extrabold text-white shadow-[0_12px_22px_rgba(249,115,22,0.25)] transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 dark:ring-8 dark:ring-white"
                disabled={selectedRating == null || isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Guardando..." : "Guardar calificación"}
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
