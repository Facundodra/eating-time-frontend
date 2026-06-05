import axios from "axios";

import type {
  OrderStatus,
  WorkbenchFilters,
  WorkbenchOrderItem,
  WorkbenchOrderItemApiResponse,
  WorkbenchOrder,
  WorkbenchOrderApiResponse,
} from "@/lib/restaurant/workbench/types";
import { api } from "@/services/shared/api-client";

type BackendErrorResponse = {
  message?: string;
  error?: string;
  detail?: string;
};

type WorkbenchOrdersApiResponse =
  | WorkbenchOrderApiResponse[]
  | {
      content?: WorkbenchOrderApiResponse[];
      data?: WorkbenchOrderApiResponse[];
      items?: WorkbenchOrderApiResponse[];
      pedidos?: WorkbenchOrderApiResponse[];
      orders?: WorkbenchOrderApiResponse[];
    };

function mapWorkbenchOrderItem(
  item: WorkbenchOrderItemApiResponse,
): WorkbenchOrderItem {
  return {
    id: item.id ?? item.platoId ?? 0,
    dishId: item.platoId ?? null,
    name: item.nombrePlato ?? item.platoNombre ?? item.nombre ?? "Plato",
    quantity: item.cantidad ?? 1,
    unitPrice: item.costoUnitario ?? item.precio ?? null,
    total: item.total ?? null,
  };
}

function getOrderItems(order: WorkbenchOrderApiResponse): WorkbenchOrderItem[] {
  return (order.items ?? order.detalles ?? []).map(mapWorkbenchOrderItem);
}

function getItemCount(
  order: WorkbenchOrderApiResponse,
  items: WorkbenchOrderItem[],
) {
  return (
    order.cantidadItems ??
    order.cantidadPlatos ??
    items.reduce((total, item) => total + item.quantity, 0)
  );
}

function mapWorkbenchOrder(order: WorkbenchOrderApiResponse): WorkbenchOrder {
  const items = getOrderItems(order);

  return {
    id: order.id ?? order.pedidoId ?? 0,
    restaurantId: order.localId ?? order.idLocal ?? 0,
    customerId: order.clienteId ?? order.idCliente ?? 0,
    customerName: order.clienteNombre ?? order.nombreCliente ?? null,
    couponId: order.cuponId ?? null,
    status:
      order.estado ??
      order.estadoPedido ??
      order.status ??
      order.estadoPago ??
      "PENDIENTE_CONFIRMACION_LOCAL",
    total: order.total ?? order.montoTotal ?? 0,
    itemCount: getItemCount(order, items),
    items,
    discount: order.descuento ?? null,
    estimatedTime: order.tiempoEstimado ?? null,
    invoiceUrl: order.urlFactura ?? null,
    comment: order.comentario ?? null,
    address: order.direccion ?? null,
    instructions: order.indicaciones ?? null,
    rejectionReason: order.motivoRechazo ?? null,
    createdAt: order.creacion ?? order.fechaCreacion ?? order.createdAt ?? "",
    deletedAt: order.eliminacion ?? null,
  };
}

function getWorkbenchOrders(
  data: WorkbenchOrdersApiResponse | null | undefined,
): WorkbenchOrderApiResponse[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  return data.content ?? data.data ?? data.items ?? data.pedidos ?? data.orders ?? [];
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
  restaurantId: string,
  filters?: WorkbenchFilters,
): Promise<WorkbenchOrder[]> {
  const params = new URLSearchParams();

  if (filters?.sortBy) params.set("orden", filters.sortBy);
  if (filters?.direction) params.set("sentido", filters.direction);
  if (filters?.orderId) params.set("identificador", filters.orderId);
  if (filters?.startDateTime && filters?.endDateTime) {
    params.set("rangoInicio", filters.startDateTime);
    params.set("rangoFin", filters.endDateTime);
  }

  const query = params.toString() ? `?${params.toString()}` : "";

  try {
    const response = await api.get<WorkbenchOrdersApiResponse>(
      `/api/local/${encodeURIComponent(restaurantId)}/mesa-trabajo${query}`,
      { timeout: 15000 },
    );
    return getWorkbenchOrders(response.data)
      .map(mapWorkbenchOrder)
      .filter(
        (order) =>
          order.status !== "EN_CARRITO" && order.status !== "ETAPA_DE_PAGO",
      );
  } catch (error) {
    throw new Error(
      getBackendErrorMessage(error, "No se pudieron cargar los pedidos."),
    );
  }
}

type WorkbenchOrderAction = "confirmar" | "rechazar";

type WorkbenchActionBody = {
  estado?: OrderStatus;
  motivoRechazo?: string;
  tiempoEstimado?: string;
};

export async function updateWorkbenchOrderStatus(
  localId: string,
  orderId: number,
  action: WorkbenchOrderAction,
  body: WorkbenchActionBody,
): Promise<WorkbenchOrder | null> {
  const encodedLocalId = encodeURIComponent(localId);
  const encodedOrderId = encodeURIComponent(orderId.toString());
  const endpoint =
    action === "confirmar"
      ? `/api/local/${encodedLocalId}/pedido/${encodedOrderId}`
      : `/api/local/${encodedLocalId}/pedido/${encodedOrderId}/rechazar`;

  try {
    const response = await api.patch<WorkbenchOrderApiResponse | null>(
      endpoint,
      body,
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    return response.data ? mapWorkbenchOrder(response.data) : null;
  } catch (error) {
    throw new Error(
      getBackendErrorMessage(error, `No se pudo ${action} el pedido.`),
    );
  }
}

export async function confirmWorkbenchOrder(
  localId: string,
  orderId: number,
  estimatedTime: string,
): Promise<WorkbenchOrder | null> {
  return updateWorkbenchOrderStatus(localId, orderId, "confirmar", {
    estado: "ACEPTADO_LOCAL",
    tiempoEstimado: estimatedTime,
  });
}

export async function rejectWorkbenchOrder(
  localId: string,
  orderId: number,
  rejectionReason: string,
): Promise<WorkbenchOrder | null> {
  return updateWorkbenchOrderStatus(localId, orderId, "rechazar", {
    estado: "RECHAZADO_LOCAL",
    motivoRechazo: rejectionReason,
  });
}

export async function changeWorkbenchOrderStatus(
  localId: string,
  orderId: number,
  status: OrderStatus,
): Promise<WorkbenchOrder | null> {
  const encodedLocalId = encodeURIComponent(localId);
  const encodedOrderId = encodeURIComponent(orderId.toString());

  try {
    const response = await api.patch<WorkbenchOrderApiResponse | null>(
      `/api/local/${encodedLocalId}/pedido/${encodedOrderId}/estado`,
      { estado: status },
      { headers: { "Content-Type": "application/json" } },
    );

    return response.data ? mapWorkbenchOrder(response.data) : null;
  } catch (error) {
    throw new Error(
      getBackendErrorMessage(error, "No se pudo actualizar el estado del pedido."),
    );
  }
}
