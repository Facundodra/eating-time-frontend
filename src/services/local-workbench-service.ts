import type { WorkbenchFilters, WorkbenchOrder } from "@/lib/local-workbench/types";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function getWorkbenchOrders(
  localId: string,
  filters?: WorkbenchFilters,
): Promise<WorkbenchOrder[]> {
  const params = new URLSearchParams();

  if (filters?.orden) params.set("orden", filters.orden);
  if (filters?.sentido) params.set("sentido", filters.sentido);
  if (filters?.identificador) params.set("identificador", filters.identificador);
  if (filters?.rangoInicio) params.set("rangoInicio", filters.rangoInicio);
  if (filters?.rangoFin) params.set("rangoFin", filters.rangoFin);

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(
    `${API_URL}/api/local/${localId}/mesa-trabajo${query}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`Error al obtener pedidos (${response.status})`);
  }

  return response.json();
}
