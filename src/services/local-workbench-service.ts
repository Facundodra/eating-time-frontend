import type {
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
