import axios from "axios";

import type {
  OrderStatus,
  WorkbenchFilters,
  WorkbenchOrder,
  WorkbenchOrderApiResponse,
} from "@/lib/local-workbench/types";
import { api } from "@/services/api-client";

type BackendErrorResponse = {
  message?: string;
  error?: string;
  detail?: string;
};

function mapWorkbenchOrder(order: WorkbenchOrderApiResponse): WorkbenchOrder {
  return {
    id: order.id,
    localId: order.localId,
    customerId: order.clienteId,
    couponId: order.cuponId,
    status: order.estado,
    total: order.total,
    discount: order.descuento,
    estimatedTime: order.tiempoEstimado,
    invoiceUrl: order.urlFactura,
    comment: order.comentario,
    address: order.direccion,
    instructions: order.indicaciones,
    createdAt: order.creacion,
    deletedAt: order.eliminacion,
  };
}

function getBackendErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<BackendErrorResponse | string>(error)) {
    const data = error.response?.data;

    if (typeof data === "string") return data.trim() || fallback;
    if (data) return data.message ?? data.error ?? data.detail ?? fallback;
  }

  return fallback;
}

export async function fetchWorkbenchOrders(
  localId: string,
  filters?: WorkbenchFilters,
): Promise<WorkbenchOrder[]> {
  const params = new URLSearchParams();

  if (filters?.sortBy) params.set("orden", filters.sortBy);
  if (filters?.direction) params.set("sentido", filters.direction);
  if (filters?.orderId) params.set("identificador", filters.orderId);
  if (filters?.startDateTime) params.set("rangoInicio", filters.startDateTime);
  if (filters?.endDateTime) params.set("rangoFin", filters.endDateTime);

  try {
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await api.get<WorkbenchOrderApiResponse[]>(
      `/api/local/${encodeURIComponent(localId)}/mesa-trabajo${query}`,
    );

    return response.data.map(mapWorkbenchOrder);
  } catch (error) {
    throw new Error(
      getBackendErrorMessage(error, "No se pudieron cargar los pedidos."),
    );
  }
}

type WorkbenchOrderAction = "confirmar" | "rechazar";

const orderActionStatus: Record<WorkbenchOrderAction, OrderStatus> = {
  confirmar: "ACEPTADO_LOCAL",
  rechazar: "RECHAZADO_LOCAL",
};

export async function updateWorkbenchOrderStatus(
  localId: string,
  orderId: number,
  action: WorkbenchOrderAction,
): Promise<OrderStatus> {
  try {
    await api.patch(
      `/api/local/${encodeURIComponent(localId)}/pedido/${encodeURIComponent(
        orderId.toString(),
      )}/${action}`,
    );
  } catch (error) {
    throw new Error(
      getBackendErrorMessage(error, `No se pudo ${action} el pedido.`),
    );
  }

  return orderActionStatus[action];
}

export async function confirmWorkbenchOrder(
  localId: string,
  orderId: number,
): Promise<OrderStatus> {
  return updateWorkbenchOrderStatus(localId, orderId, "confirmar");
}

export async function rejectWorkbenchOrder(
  localId: string,
  orderId: number,
): Promise<OrderStatus> {
  return updateWorkbenchOrderStatus(localId, orderId, "rechazar");
}
