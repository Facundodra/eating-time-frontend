"use client";

import { useState, useTransition } from "react";

import { addDeliveryPoint } from "@/services/client/client-service";

export default function DeliveryPointForm() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refreshPage() {
        setTimeout(()=>{
            window.location.reload();
        }, 2000);
   }   

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      try {
        await addDeliveryPoint({
          loc: String(fd.get("loc") ?? "").trim(),
          street: String(fd.get("street") ?? "").trim(),
          number: String(fd.get("number") ?? "").trim(),
          apto: String(fd.get("apto") ?? "").trim(),
          indications: String(fd.get("indications") ?? "").trim(),
        });
        setSuccess(true);

        refreshPage();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear el punto.");
      }
    });
  }

  if (success) {
    return (
      <div className="flex flex-col items-center text-center px-5 py-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/15 mb-5">
          <svg className="h-7 w-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          ¡Punto guardado!
        </h2>
        <p className="mt-3 text-sm font-medium text-slate-400 leading-6">
          La dirección fue agregada a tu cuenta.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 pb-5 pt-2">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="loc" className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
            Localidad
          </label>
          <input
            id="loc"
            name="loc"
            type="text"
            placeholder="Ej: Montevideo, Pando"
            className="field"
            required
          />
        </div>

        <div className="flex flex-wrap gap-y-5">
          <div className="w-full md:w-1/3 md:pr-2">
            <label htmlFor="street" className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
              Calle
            </label>
            <input
              id="street"
              name="street"
              type="text"
              placeholder="Ej: 18 de Julio"
              className="field"
              required
            />
          </div>
          <div className="w-full md:w-1/3 md:px-2">
            <label htmlFor="number" className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
              Número
            </label>
            <input
              id="number"
              name="number"
              type="text"
              placeholder="2718"
              className="field"
              required
            />
          </div>
          <div className="w-full md:w-1/3 md:pl-2">
            <label htmlFor="apto" className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
              Apartamento
            </label>
            <input
              id="apto"
              name="apto"
              type="text"
              placeholder="901"
              className="field"
            />
          </div>
        </div>

        <div>
          <label htmlFor="indications" className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
            Indicaciones
          </label>
          <textarea
            id="indications"
            name="indications"
            placeholder="Ej: portón azul, timbre 301, edificio en esquina"
            className="field py-3 !h-auto"
            rows={3}
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              {error === "Conflict"
                ? "Ya existe un punto de entrega con ese número de puerta registrado."
                : "No se pudo guardar el punto de entrega. Intentalo nuevamente."}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Guardando..." : "Guardar punto"}
        </button>
      </form>

      <div className="my-6 h-px bg-gray-100 dark:bg-slate-800" />
      <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
        También podés agregar una dirección durante el checkout sin guardarla en tu cuenta.
      </p>
    </div>
  );
}
