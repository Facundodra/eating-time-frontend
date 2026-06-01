"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  obtenerSolicitudRegistroRestaurantPorId as getRestaurantRegistrationRequestById,
  type SolicitudRegistroResponse as RestaurantRegistrationRequestResponse,
} from "@/services/admin/gestion-service";

import type { RestaurantRequest } from "./requests-data";
import {
  getRequestStatusLabel,
  getRequestStatusStyle,
} from "./requests-status";
import { useRequests } from "./use-requests";

type Props = Readonly<{
  id: number;
}>;

function mapBackendStatusToRequestStatus(
  response: RestaurantRegistrationRequestResponse,
): RestaurantRequest["status"] {
  if (response.rechazo || response.estado === "RECHAZADA") {
    return "rejected";
  }

  if (
    response.aceptacion ||
    response.estado === "APROBADA" ||
    response.estado === "ACEPTADA"
  ) {
    return "approved";
  }

  return "pending";
}

function mapBackendToRestaurantRequest(
  response: RestaurantRegistrationRequestResponse,
): RestaurantRequest {
  return {
    id: response.id,
    restaurant: response.nombre,
    email: response.email,
    phone: response.telefono ?? "",
    date: response.creacion || response.fechaSolicitud,
    status: mapBackendStatusToRequestStatus(response),
    address: response.direccion,
    foodType: response.tipoComida ?? "No especificado",
    description: response.descripcion ?? "",
    images: response.fotosDeReferencia ?? [],
  };
}

export default function RequestDetailPage({ id }: Props) {
  const {
    getRequestById,
    approveRequest,
    rejectRequest,
    error: requestError,
  } = useRequests();
  const requestFromList = getRequestById(id);

  const [request, setRequest] = useState<RestaurantRequest | null>(
    requestFromList ?? null,
  );
  const [loadingRequest, setLoadingRequest] = useState(!requestFromList);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadRequest = useCallback(async () => {
    try {
      setLoadingRequest(true);
      setDetailError(null);

      const data = await getRestaurantRegistrationRequestById(id);
      setRequest(mapBackendToRestaurantRequest(data));
    } catch (err) {
      setDetailError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la solicitud. Intentalo nuevamente.",
      );
    } finally {
      setLoadingRequest(false);
    }
  }, [id]);

  useEffect(() => {
    if (!requestFromList) {
      void loadRequest();
    }
  }, [loadRequest, requestFromList]);

  const isSuccess = Boolean(successMessage);
  const errorMessage = detailError ?? actionError ?? requestError;

  async function handleApprove() {
    setIsApproving(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await approveRequest(id);
      setRequest((current) =>
        current ? { ...current, status: "approved" } : current,
      );
      setSuccessMessage("La solicitud fue aprobada correctamente.");
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "No se pudo aprobar la solicitud. Intentalo nuevamente.",
      );
      await loadRequest();
    } finally {
      setIsApproving(false);
    }
  }

  async function handleReject() {
    setIsRejecting(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await rejectRequest(id);
      setRequest((current) =>
        current ? { ...current, status: "rejected" } : current,
      );
      setSuccessMessage("La solicitud fue rechazada correctamente.");
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "No se pudo rechazar la solicitud. Intentalo nuevamente.",
      );
      await loadRequest();
    } finally {
      setIsRejecting(false);
    }
  }

  if (loadingRequest) {
    return (
      <section className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6">
        <BackLink />

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Cargando solicitud...
          </p>
        </div>
      </section>
    );
  }

  if (!request) {
    return (
      <section className="space-y-4">
        <BackLink />

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
            {detailError
              ? "Error al cargar la solicitud"
              : "Solicitud no encontrada"}
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {detailError ?? "No existe una solicitud asociada al id recibido."}
          </p>
        </div>
      </section>
    );
  }

  const isPending = request.status === "pending";
  const isBusy = isApproving || isRejecting;
  const statusDescription = isPending
    ? "Solicitud de registro de local gastronomico pendiente de revision administrativa."
    : "Solicitud de registro de local gastronomico ya procesada.";

  return (
    <section className="space-y-5">
      <BackLink />

      <header>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Administracion / Solicitudes / Detalle
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
          {request.restaurant}
        </h1>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {statusDescription}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <article className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-gray-100 px-6 py-4 dark:border-slate-800">
              <h2 className="font-bold text-slate-950 dark:text-white">
                Informacion general
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Datos principales de la solicitud registrada.
              </p>
            </div>

            <div className="grid gap-6 px-6 py-5 md:grid-cols-2">
              <InfoItem label="Nombre del local" value={request.restaurant} />
              <InfoItem label="Email" value={request.email} />
              <InfoItem label="Telefono" value={request.phone} />
              <InfoItem label="Fecha de solicitud" value={request.date} />
              <InfoItem label="Direccion" value={request.address} />
              <InfoItem label="Tipo de comida" value={request.foodType} />
            </div>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-gray-100 px-6 py-4 dark:border-slate-800">
              <h2 className="font-bold text-slate-950 dark:text-white">
                Descripcion del local
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Informacion proporcionada por el solicitante.
              </p>
            </div>

            <p className="px-6 py-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {request.description}
            </p>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-gray-100 px-6 py-4 dark:border-slate-800">
              <h2 className="font-bold text-slate-950 dark:text-white">
                Imagenes adjuntas
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Material enviado junto a la solicitud del local.
              </p>
            </div>

            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
              {request.images.length > 0 ? (
                request.images.map((image) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={image}
                    src={image}
                    alt={`Imagen de ${request.restaurant}`}
                    loading="lazy"
                    className="h-36 w-full rounded-2xl border border-gray-200 object-cover dark:border-slate-800"
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Esta solicitud no tiene imagenes adjuntas.
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
            Revisa la informacion proporcionada por el local antes de aprobar o
            rechazar la solicitud.
          </p>

          {!isPending ? (
            <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-slate-950 dark:text-slate-300">
              Esta solicitud ya fue procesada.
            </p>
          ) : null}

          {isSuccess && successMessage ? (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
              {successMessage}
            </p>
          ) : null}

          {errorMessage ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={handleApprove}
              disabled={!isPending || isBusy || isSuccess}
              className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isApproving ? "Aprobando..." : "Aprobar solicitud"}
            </button>

            <button
              type="button"
              onClick={handleReject}
              disabled={!isPending || isBusy || isSuccess}
              className="w-full rounded-xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-500 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRejecting ? "Rechazando..." : "Rechazar solicitud"}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/requests"
      className="inline-flex text-sm font-bold text-orange-500 transition hover:text-orange-400"
    >
      {"<- Volver a solicitudes"}
    </Link>
  );
}

function InfoItem({ label, value }: Readonly<{ label: string; value: string }>) {
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
