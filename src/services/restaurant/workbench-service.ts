import type {
  OrderItem,
  OrderItemApiResponse,
  WorkbenchFilters,
  WorkbenchOrder,
  WorkbenchOrderApiResponse,
} from "@/lib/restaurant/workbench/types";
import { WORKBENCH_VISIBLE_STATUSES } from "@/lib/restaurant/workbench/types";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080";

function mapOrderItem(item: OrderItemApiResponse): OrderItem {
  return {
    id: item.id,
    orderId: item.pedidoId,
    dishId: item.platoId,
    name: item.nombre,
    discountId: item.descuentoId,
    quantity: item.cantidad,
    unitCost: item.costoUnitario,
    discountApplied: item.descuentoAplicado,
    total: item.total,
    createdAt: item.creacion,
    deletedAt: item.eliminacion,
  };
}

function mapWorkbenchOrder(order: WorkbenchOrderApiResponse): WorkbenchOrder {
  return {
    id: order.id,
    restaurantId: order.localId,
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
    rejectionReason: order.motivoRechazo,
    createdAt: order.creacion,
    deletedAt: order.eliminacion,
    items: (order.items ?? []).map(mapOrderItem),
  };
}

export async function acceptOrder(
  restaurantId: string,
  orderId: number,
  estimatedTime: string,
): Promise<WorkbenchOrder> {
  const response = await fetch(
    `${apiBaseUrl}/api/local/${restaurantId}/pedido/${orderId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tiempoEstimado: estimatedTime }),
    },
  );

  if (!response.ok) {
    const errorMessages: Record<number, string> = {
      400: "El tiempo estimado es requerido.",
      404: "Pedido no encontrado.",
      409: "El pedido ya no está en estado pendiente.",
    };
    throw new Error(
      errorMessages[response.status] ??
        `Error al confirmar el pedido (${response.status})`,
    );
  }

  const order = (await response.json()) as WorkbenchOrderApiResponse;
  return mapWorkbenchOrder(order);
}

export async function rejectOrder(
  restaurantId: string,
  orderId: number,
  rejectionReason: string,
): Promise<WorkbenchOrder> {
  const response = await fetch(
    `${apiBaseUrl}/api/local/${restaurantId}/pedido/${orderId}/rechazar`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivoRechazo: rejectionReason }),
    },
  );

  if (!response.ok) {
    const errorMessages: Record<number, string> = {
      400: "El motivo de rechazo es requerido.",
      404: "Pedido no encontrado.",
      409: "El pedido ya no está en estado pendiente.",
    };
    throw new Error(
      errorMessages[response.status] ??
        `Error al rechazar el pedido (${response.status})`,
    );
  }

  const order = (await response.json()) as WorkbenchOrderApiResponse;
  return mapWorkbenchOrder(order);
}

export async function fetchWorkbenchOrders(
  restaurantId: string,
  filters?: WorkbenchFilters,
): Promise<WorkbenchOrder[]> {
  const params = new URLSearchParams();

  if (filters?.sortBy) params.set("orden", filters.sortBy);
  if (filters?.direction) params.set("sentido", filters.direction);
  if (filters?.orderId) params.set("identificador", filters.orderId);
  if (filters?.startDateTime) params.set("rangoInicio", filters.startDateTime);
  if (filters?.endDateTime) params.set("rangoFin", filters.endDateTime);

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(
    `${apiBaseUrl}/api/local/${restaurantId}/mesa-trabajo${query}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`Error al obtener pedidos (${response.status})`);
  }

  const orders = (await response.json()) as WorkbenchOrderApiResponse[];
  return orders
    .filter((o) => WORKBENCH_VISIBLE_STATUSES.has(o.estado))
    .map(mapWorkbenchOrder);
}
