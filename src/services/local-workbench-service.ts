import type {
  OrderStatus,
  WorkbenchFilters,
  WorkbenchOrder,
  WorkbenchOrderApiResponse,
} from "@/lib/local-workbench/types";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080";

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

async function getBackendErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const data = (await response.json()) as {
        message?: string;
        error?: string;
        detail?: string;
      };

      return data.message ?? data.error ?? data.detail ?? fallback;
    }

    const text = await response.text();
    return text.trim() || fallback;
  } catch {
    return fallback;
  }
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

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(
    `${apiBaseUrl}/api/local/${localId}/mesa-trabajo${query}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`Error al obtener pedidos (${response.status})`);
  }

  const orders = (await response.json()) as WorkbenchOrderApiResponse[];
  return orders.map(mapWorkbenchOrder);
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
  const response = await fetch(
    `${apiBaseUrl}/api/local/${encodeURIComponent(
      localId,
    )}/pedido/${encodeURIComponent(orderId.toString())}/${action}`,
    {
      method: "PATCH",
      credentials: "include",
    },
  );

  if (!response.ok) {
    const errorMessage = await getBackendErrorMessage(
      response,
      `Error al ${action} el pedido (${response.status})`,
    );

    throw new Error(errorMessage);
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
