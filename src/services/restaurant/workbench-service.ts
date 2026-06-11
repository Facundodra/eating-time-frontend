import axios from "axios";

import type {
  OrderStatus,
  WorkbenchFilters,
  WorkbenchOrderItem,
  WorkbenchOrderItemApiResponse,
  WorkbenchOrder,
  WorkbenchOrderApiResponse,
  WorkbenchOrderRating,
  WorkbenchRatingValue,
} from "@/lib/restaurant/workbench/types";
import { clientApi } from "@/services/shared/api-client";

type BackendErrorResponse = {
  message?: string;
  error?: string;
  detail?: string;
  path?: string;
  status?: number;
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

type WorkbenchOrderRatingApiResponse = {
  id?: number;
  pedidoId?: number;
  calificacion?: WorkbenchRatingValue | string | null;
  comentario?: string | null;
  creacion?: string | null;
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
    orderId: item.pedidoId,
    discountId: item.descuentoId,
    unitCost: item.costoUnitario ?? item.precio ?? null,
    discountApplied: item.descuentoAplicado,
    createdAt: item.creacion,
    deletedAt: item.eliminacion,
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

function normalizeWorkbenchRatingValue(
  value: unknown,
): WorkbenchRatingValue | null {
  if (typeof value === "number" && Number.isInteger(value)) {
    if (value === 0 || value === 1) return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();

    if (normalized === "0" || normalized === "DISLIKE" || normalized === "DISLIKED") {
      return 0;
    }

    if (normalized === "1" || normalized === "LIKE" || normalized === "LIKED") {
      return 1;
    }
  }

  return null;
}

function mapWorkbenchRatingFromApi(
  rating: unknown,
  orderId: number,
): WorkbenchOrderRating | null {
  if (rating == null) return null;

  if (typeof rating === "string" || typeof rating === "number") {
    const calificacion = normalizeWorkbenchRatingValue(rating);
    if (calificacion == null) return null;

    return {
      pedidoId: orderId,
      calificacion,
      comentario: null,
      creacion: null,
    };
  }

  if (typeof rating !== "object") return null;

  const record = rating as Record<string, unknown>;
  const nestedRating =
    record.calificacionCliente ??
    record.clienteCalificacion ??
    record.calificacionLocal ??
    record.localCalificacion ??
    record.calificacion ??
    record.rating ??
    record.data;

  if (nestedRating != null && nestedRating !== rating) {
    const mappedNestedRating = mapWorkbenchRatingFromApi(nestedRating, orderId);
    if (mappedNestedRating) return mappedNestedRating;
  }

  const calificacion = normalizeWorkbenchRatingValue(record.calificacion);
  if (calificacion == null) return null;

  return {
    id: typeof record.id === "number" ? record.id : undefined,
    pedidoId: typeof record.pedidoId === "number" ? record.pedidoId : orderId,
    calificacion,
    comentario: typeof record.comentario === "string" ? record.comentario : null,
    creacion: typeof record.creacion === "string" ? record.creacion : null,
  };
}

function hasWorkbenchRatingFromApi(...values: unknown[]): boolean {
  return values.some((value) => {
    if (value == null) return false;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value > 0;

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      return normalized !== "" && normalized !== "false" && normalized !== "0";
    }

    if (typeof value !== "object") return false;

    const record = value as Record<string, unknown>;
    return (
      normalizeWorkbenchRatingValue(record.calificacion) != null ||
      hasWorkbenchRatingFromApi(
        record.id,
        record.pedidoId,
        record.calificacionCliente,
        record.clienteCalificacion,
        record.tieneCalificacionCliente,
        record.calificadoCliente,
        record.calificacionLocal,
        record.localCalificacion,
        record.tieneCalificacionLocal,
        record.calificadoLocal,
        record.tieneCalificacion,
        record.calificado,
        record.calificacion,
        record.rating,
        record.data,
      )
    );
  });
}

function mapWorkbenchOrder(order: WorkbenchOrderApiResponse): WorkbenchOrder {
  const items = getOrderItems(order);
  const orderId = order.id ?? order.pedidoId ?? 0;
  const rating = mapWorkbenchRatingFromApi(
    order.calificacionCliente ??
      order.clienteCalificacion ??
      order.calificacionLocal ??
      order.localCalificacion ??
      order.calificacion ??
      order.rating ??
      null,
    orderId,
  );

  return {
    id: orderId,
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
    customerRating: rating,
    hasCustomerRating:
      Boolean(rating) ||
      hasWorkbenchRatingFromApi(
        order.calificacionCliente,
        order.clienteCalificacion,
        order.tieneCalificacionCliente,
        order.calificadoCliente,
        order.calificacionLocal,
        order.localCalificacion,
        order.tieneCalificacionLocal,
        order.calificadoLocal,
        order.tieneCalificacion,
        order.calificado,
        order.calificacion,
        order.rating,
      ),
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
    if (data) {
      if (
        error.response?.status === 404 &&
        data.path?.includes("/pedido/") &&
        data.path.endsWith("/avanzar")
      ) {
        return `El backend configurado no tiene disponible PATCH ${data.path}. Actualiza el backend desplegado o apunta NEXT_PUBLIC_API_URL a un backend que tenga ese endpoint.`;
      }

      return data.message ?? data.detail ?? data.error ?? fallback;
    }
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
    const response = await clientApi.get<WorkbenchOrdersApiResponse>(
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

const ALL_ORDERS_START_DATE_TIME = "1970-01-01T00:00:00";
const ALL_ORDERS_END_DATE_TIME = "2100-12-31T23:59:59";

export async function fetchRestaurantOrders(
  restaurantId: string,
  filters?: WorkbenchFilters,
): Promise<WorkbenchOrder[]> {
  return fetchWorkbenchOrders(restaurantId, {
    ...filters,
    startDateTime: filters?.startDateTime ?? ALL_ORDERS_START_DATE_TIME,
    endDateTime: filters?.endDateTime ?? ALL_ORDERS_END_DATE_TIME,
  });
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
    const response = await clientApi.patch<WorkbenchOrderApiResponse | null>(
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
    const response = await clientApi.patch<WorkbenchOrderApiResponse | null>(
      `/api/local/${encodedLocalId}/pedido/${encodedOrderId}/avanzar`,
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

export type SubmitWorkbenchOrderRatingRequest = {
  calificacion: WorkbenchRatingValue;
  comentario?: string;
};

export async function submitWorkbenchOrderCustomerRating(
  orderId: number,
  request: SubmitWorkbenchOrderRatingRequest,
): Promise<WorkbenchOrderRating> {
  const body = {
    pedidoId: orderId,
    calificacion: request.calificacion,
    comentario: request.comentario?.trim() || null,
  };

  try {
    const response = await clientApi.post<WorkbenchOrderRatingApiResponse>(
      `/api/pedidos/${encodeURIComponent(orderId.toString())}/calificacion-local`,
      body,
      { headers: { "Content-Type": "application/json" } },
    );

    return (
      mapWorkbenchRatingFromApi(response.data, orderId) ?? {
        pedidoId: orderId,
        calificacion: request.calificacion,
        comentario: body.comentario,
      }
    );
  } catch (error) {
    throw new Error(
      getBackendErrorMessage(error, "No se pudo registrar la calificacion."),
    );
  }
}
