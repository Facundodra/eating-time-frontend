"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRequests } from "./use-requests";
import {
  getRequestStatusLabel,
  getRequestStatusStyle,
} from "./requests-status";;

type Props = {
  email: string;
};

export default function RequestDetailPage({ email }: Props) {
  const { getRequestByEmail, approveRequest, rejectRequest } = useRequests();
  const request = getRequestByEmail(email);
  const [message, setMessage] = useState("");

  if (!request) {
    return (
      <section className="space-y-4">
        <Link
          href="/admin/requests"
          className="text-sm font-bold text-orange-500 transition hover:text-orange-400"
        >
          ← Volver a solicitudes
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
            Solicitud no encontrada
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            No existe una solicitud asociada al email recibido.
          </p>
        </div>
      </section>
    );
  }

  const isPending = request.status === "pending";

  function handleApprove() {
    approveRequest(email);
    setMessage("La solicitud fue aprobada correctamente.");
  }

  function handleReject() {
    rejectRequest(email);
    setMessage("La solicitud fue rechazada correctamente.");
  }

  return (
    <section className="space-y-5">
      <Link
        href="/admin/requests"
        className="inline-flex text-sm font-bold text-orange-500 transition hover:text-orange-400"
      >
        ← Volver a solicitudes
      </Link>

      <header>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Administración / Solicitudes / Detalle
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
          {request.restaurant}
        </h1>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Solicitud de registro de local gastronómico pendiente de revisión
          administrativa.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <article className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-gray-100 px-6 py-4 dark:border-slate-800">
              <h2 className="font-bold text-slate-950 dark:text-white">
                Información general
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Datos principales de la solicitud registrada.
              </p>
            </div>

            <div className="grid gap-6 px-6 py-5 md:grid-cols-2">
              <InfoItem label="Nombre del local" value={request.restaurant} />
              <InfoItem label="Email" value={request.email} />
              <InfoItem label="Teléfono" value={request.phone} />
              <InfoItem label="Fecha de solicitud" value={request.date} />
              <InfoItem label="Dirección" value={request.address} />
              <InfoItem label="Tipo de comida" value={request.foodType} />
            </div>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-gray-100 px-6 py-4 dark:border-slate-800">
              <h2 className="font-bold text-slate-950 dark:text-white">
                Descripción del local
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Información proporcionada por el solicitante.
              </p>
            </div>

            <p className="px-6 py-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {request.description}
            </p>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-gray-100 px-6 py-4 dark:border-slate-800">
              <h2 className="font-bold text-slate-950 dark:text-white">
                Imágenes adjuntas
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Material enviado junto a la solicitud del local.
              </p>
            </div>

            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
              {request.images.length > 0 ? (
                request.images.map((image) => (
                  <Image
                    key={image}
                    src={image}
                    alt={`Imagen de ${request.restaurant}`}
                    width={300}
                    height={200}
                    className="h-36 w-full rounded-2xl border border-gray-200 object-cover dark:border-slate-800"
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Esta solicitud no tiene imágenes adjuntas.
                </p>
              )}
            </div>
          </article>
        </div>

        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${getRequestStatusStyle(
              request.status,
            )}`}
          >
            {getRequestStatusLabel(request.status)}
          </span>

          <h2 className="mt-5 font-bold text-slate-950 dark:text-white">
            Acciones administrativas
          </h2>

          <p className="mt-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
            Revisá la información proporcionada por el local antes de aprobar o
            rechazar la solicitud.
          </p>

          {!isPending && (
            <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-slate-950 dark:text-slate-300">
              Esta solicitud ya fue procesada.
            </p>
          )}

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={handleApprove}
              disabled={!isPending}
              className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Aprobar solicitud
            </button>

            <button
              type="button"
              onClick={handleReject}
              disabled={!isPending}
              className="w-full rounded-xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-500 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Rechazar solicitud
            </button>
          </div>

          {message && (
            <p className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
              {message}
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
        {value}
      </p>
    </div>
  );
}
