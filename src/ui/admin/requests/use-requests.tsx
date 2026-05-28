"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LocalRequest, RequestStatus } from "./requests-data";
import {
  aprobarSolicitudRegistroLocal,
  obtenerSolicitudesRegistroLocal,
  rechazarSolicitudRegistroLocal,
  type SolicitudRegistroResponse,
} from "@/services/gestion-service";

type UseRequestsOptions = {
  autoLoad?: boolean;
};

function getStatusFromBackend(
  response: SolicitudRegistroResponse,
): RequestStatus {
  if (response.rechazo) {
    return "rejected";
  }

  if (response.aceptacion) {
    return "approved";
  }

  if (response.estado === "RECHAZADA") {
    return "rejected";
  }

  if (response.estado === "APROBADA" || response.estado === "ACEPTADA") {
    return "approved";
  }

  return "pending";
}

function mapBackendToLocalRequest(
  response: SolicitudRegistroResponse,
): LocalRequest {
  return {
    id: Number(response.id),
    restaurant: response.nombre ?? "",
    email: response.email ?? "",
    phone: response.telefono ?? "",
    date: response.creacion ?? response.fechaSolicitud ?? "",
    status: getStatusFromBackend(response),
    address: response.direccion ?? "",
    foodType: response.tipoComida ?? "No especificado",
    description: response.descripcion ?? "",
    images: response.fotosDeReferencia ?? [],
  };
}

export function useRequests(options: UseRequestsOptions = {}) {
  const { autoLoad = true } = options;

  const [requests, setRequests] = useState<LocalRequest[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await obtenerSolicitudesRegistroLocal();
      const mapped = data.map(mapBackendToLocalRequest);

      setRequests(mapped);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al cargar solicitudes";

      console.error("Error al cargar solicitudes:", err);

      setError(message);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoLoad) {
      setLoading(false);
      return;
    }

    void loadRequests();
  }, [autoLoad, loadRequests]);

  const updateRequestStatus = useCallback(
    (id: number, status: RequestStatus) => {
      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === id ? { ...request, status } : request,
        ),
      );
    },
    [],
  );

  const approveRequest = useCallback(
    async (id: number) => {
      try {
        setError(null);

        await aprobarSolicitudRegistroLocal(id);
        updateRequestStatus(id, "approved");
      } catch (err) {
        const requestError =
          err instanceof Error
            ? err
            : new Error("Error al aprobar solicitud");

        console.error("Error al aprobar solicitud:", err);
        setError(requestError.message);
        throw requestError;
      }
    },
    [updateRequestStatus],
  );

  const rejectRequest = useCallback(
    async (id: number) => {
      try {
        setError(null);

        await rechazarSolicitudRegistroLocal(id);
        updateRequestStatus(id, "rejected");
      } catch (err) {
        const requestError =
          err instanceof Error
            ? err
            : new Error("Error al rechazar solicitud");

        console.error("Error al rechazar solicitud:", err);
        setError(requestError.message);
        throw requestError;
      }
    },
    [updateRequestStatus],
  );

  const getRequestById = useCallback(
    (id: number) => {
      return requests.find((request) => request.id === id);
    },
    [requests],
  );

  const getPendingRequests = useCallback(() => {
    return requests.filter((request) => request.status === "pending");
  }, [requests]);

  const totals = useMemo(
    () => ({
      all: requests.length,
      pending: requests.filter((request) => request.status === "pending")
        .length,
      approved: requests.filter((request) => request.status === "approved")
        .length,
      rejected: requests.filter((request) => request.status === "rejected")
        .length,
    }),
    [requests],
  );

  return {
    requests,
    totals,
    getRequestById,
    getPendingRequests,
    updateRequestStatus,
    approveRequest,
    rejectRequest,
    loadRequests,
    loading,
    error,
  };
}
