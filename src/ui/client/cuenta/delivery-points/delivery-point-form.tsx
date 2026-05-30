"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { addDeliveryPoint } from "@/services/client/client-service";
import DeliveryPointList from "./delivery-point-list";


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
        setError(err instanceof Error ? err.message : "Error al crear punto");
      }
    });
  }

  if (success) {
    return (
      <div className="w-full rounded-[28px] bg-white px-9 pb-10">
        <div className="flex flex-col items-center text-center py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            ¡Punto de entrega guardado!
          </h2>
          <p className="mt-4 text-sm font-medium text-slate-400 leading-6 max-w-xs">
            El punto fue agregado a tu cuenta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[28px] px-5 pb-5 pt-2">
        <form onSubmit={handleSubmit} className="space-y-5">
        {/*  Localidad */}
        <div>
          <label htmlFor="name" className="mb-2 block text-xs font-bold text-slate-600">
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
        {/* Calle y numero */}
        <div className="flex align-center flex-wrap">
          <div className="w-full md:w-1/3 pr-2">
            <label htmlFor="street" className="mb-2 block text-xs font-bold text-slate-600">
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
          <div className="w-full md:w-1/3 px-2">
            <label htmlFor="number" className="mb-2 block text-xs font-bold text-slate-600">
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
          <div className="w-full md:w-1/3 pl-2">
            <label htmlFor="apto" className="mb-2 block text-xs font-bold text-slate-600">
              Número de apartamento
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

        {/* Indicaciones */}
        <div>
          <label htmlFor="indications" className="mb-2 block text-xs font-bold text-slate-600">
            Indicaciones
          </label>
          <textarea
            id="indications"
            name="indications"
            placeholder="Ej: portón azul, timbre 301, edificio en esquina"
            className="field py-5 !h-auto"
            rows={4}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error === "Conflict" ? "Ya existe un punto de entrega con ese número de puerta registrado para este cliente" : ""}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Guardando..." : "Guardar punto"}
        </button>
      </form>

      <div className="my-8 h-px bg-gray-200" />
      <p className="text-center bg-gray-100 text-gray-500 text-sm border border-gray-300 p-3 rounded-xl text-left">
        También podés agregar un punto de entrega manual durante el checkout sin guardarlo en tu cuenta.
      </p>
    </div>
  );
}
