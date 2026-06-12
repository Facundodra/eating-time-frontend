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
import { clientApi as api } from "@/services/shared/api-client";

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
      content?: unknown;
      data?: unknown;
      items?: unknown;
      pedidos?: unknown;
      orders?: unknown;
      resultado?: unknown;
      result?: unknown;
      registros?: unknown;
      totalPages?: number;
      totalElementos?: number;
      totalElements?: number;
    };

type WorkbenchOrderRatingApiResponse = {
  id?: number;
  pedidoId?: number;
  calificacion?: WorkbenchRatingValue | string | null;
  comentario?: string | null;
  creacion?: string | null;
};

function getRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function getArray(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}

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
  return (order.items ?? order.detalles ?? order.detallePedido ?? []).map(
    mapWorkbenchOrderItem,
  );
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

function getNullableString(value: unknown) {
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function getNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value.trim());
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function getFirstNullableString(...values: unknown[]) {
  for (const value of values) {
    const stringValue = getNullableString(value);
    if (stringValue) return stringValue;
  }

  return null;
}

function getFirstNullableNumber(...values: unknown[]) {
  for (const value of values) {
    const numberValue = getNullableNumber(value);
    if (numberValue != null) return numberValue;
  }

  return null;
}

function getNestedCustomerRecord(order: WorkbenchOrderApiResponse) {
  const customerRecord =
    getRecord(order.cliente) ??
    getRecord(order.clienteDto) ??
    getRecord(order.clienteDTO) ??
    getRecord(order.clientePedido) ??
    getRecord(order.clienteResponse) ??
    getRecord(order.clienteResumen) ??
    getRecord(order.clienteInfo) ??
    getRecord(order.clienteLocal) ??
    getRecord(order.usuarioCliente) ??
    getRecord(order.usuario) ??
    getRecord(order.user) ??
    getRecord(order.customer);

  if (!customerRecord) return null;

  const userRecord =
    getRecord(customerRecord.usuario) ?? getRecord(customerRecord.user);

  return userRecord ? { ...customerRecord, ...userRecord } : customerRecord;
}

function getCustomerId(order: WorkbenchOrderApiResponse) {
  const nestedCustomer = getNestedCustomerRecord(order);

  return (
    getFirstNullableNumber(
      order.clienteId,
      order.idCliente,
      nestedCustomer?.id,
      nestedCustomer?.clienteId,
      nestedCustomer?.idCliente,
      nestedCustomer?.usuarioId,
      nestedCustomer?.idUsuario,
      getRecord(nestedCustomer?.usuario)?.id,
      getRecord(nestedCustomer?.user)?.id,
    ) ?? 0
  );
}

function getCustomerName(order: WorkbenchOrderApiResponse) {
  const nestedCustomer = getNestedCustomerRecord(order);
  const flatLastName = getFirstNullableString(
    order.clienteApellido,
    order.clienteApellidos,
    order.apellidoCliente,
    order.apellidosCliente,
    order.apellido,
    order.apellidos,
  );
  const flatFirstName = getFirstNullableString(
    order.clienteNombre,
    order.nombreCliente,
    order.clienteRazonSocial,
    order.customerName,
    order.clientName,
    order.nombreUsuario,
    order.nombres,
    order.nombre,
  );
  const flatJoinedName =
    flatFirstName && flatLastName
      ? `${flatFirstName} ${flatLastName}`
      : flatFirstName ?? flatLastName;
  const firstName = nestedCustomer
    ? getFirstNullableString(
        nestedCustomer.nombre,
        nestedCustomer.nombres,
        nestedCustomer.nombreUsuario,
        nestedCustomer.name,
        nestedCustomer.primerNombre,
      )
    : null;
  const lastName = nestedCustomer
    ? getFirstNullableString(
        nestedCustomer.apellido,
        nestedCustomer.apellidoUsuario,
        nestedCustomer.lastname,
        nestedCustomer.apellidos,
        nestedCustomer.primerApellido,
        nestedCustomer.segundoApellido,
      )
    : null;
  const joinedName =
    firstName && lastName ? `${firstName} ${lastName}` : firstName ?? lastName;

  return (
    getFirstNullableString(
      order.nombreCompleto,
      order.clienteNombreCompleto,
      order.nombreCompletoCliente,
      order.customerName,
      order.clientName,
      order.fullName,
      flatJoinedName,
      order.clienteNombre,
      order.nombreCliente,
      order.nombre,
      order.cliente,
      order.customer,
      nestedCustomer?.nombreCompleto,
      nestedCustomer?.fullName,
      nestedCustomer?.full_name,
      nestedCustomer?.nombreCompletoCliente,
      nestedCustomer?.clienteNombreCompleto,
      nestedCustomer?.nombreCliente,
      nestedCustomer?.clienteNombre,
      nestedCustomer?.customerName,
      nestedCustomer?.clientName,
      nestedCustomer?.razonSocial,
      nestedCustomer?.clienteRazonSocial,
      nestedCustomer?.displayName,
      joinedName,
    ) ?? null
  );
}

function getCustomerDocument(order: WorkbenchOrderApiResponse) {
  const nestedCustomer = getNestedCustomerRecord(order);

  return (
    getFirstNullableString(
      order.clienteCedula,
      order.cedulaCliente,
      order.clienteDocumento,
      order.documentoCliente,
      order.cedula,
      order.documento,
      nestedCustomer?.cedula,
      nestedCustomer?.documento,
      nestedCustomer?.clienteCedula,
      nestedCustomer?.cedulaCliente,
      nestedCustomer?.ci,
    ) ?? null
  );
}

function normalizeWorkbenchRatingValue(
  value: unknown,
): WorkbenchRatingValue | null {
  if (typeof value === "number" && Number.isInteger(value)) {
    if (value === 1) return "P";
    if (value === 0) return "N";
  }

  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();

    if (
      normalized === "N" ||
      normalized === "0" ||
      normalized === "NO_ME_GUSTA" ||
      normalized === "PULGAR_ABAJO" ||
      normalized === "DISLIKE" ||
      normalized === "DISLIKED"
    ) {
      return "N";
    }

    if (
      normalized === "P" ||
      normalized === "1" ||
      normalized === "ME_GUSTA" ||
      normalized === "PULGAR_ARRIBA" ||
      normalized === "LIKE" ||
      normalized === "LIKED"
    ) {
      return "P";
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
  const directCalificacion = normalizeWorkbenchRatingValue(
    record.calificacion ?? record.valor ?? record.value ?? record.tipo,
  );

  if (directCalificacion != null) {
    return {
      id: typeof record.id === "number" ? record.id : undefined,
      pedidoId: typeof record.pedidoId === "number" ? record.pedidoId : orderId,
      calificacion: directCalificacion,
      comentario:
        typeof record.comentario === "string" ? record.comentario : null,
      creacion: typeof record.creacion === "string" ? record.creacion : null,
    };
  }

  const nestedRating =
    record.calificacionCliente ??
    record.clienteCalificacion ??
    record.calificacionDelCliente ??
    record.calificacionACliente ??
    record.calificacionClienteDto ??
    record.calificacionClienteDTO ??
    record.calificacionLocal ??
    record.localCalificacion ??
    record.calificacion ??
    record.rating ??
    record.data;

  if (nestedRating != null && nestedRating !== rating) {
    const mappedNestedRating = mapWorkbenchRatingFromApi(nestedRating, orderId);
    if (mappedNestedRating) return mappedNestedRating;
  }

  return null;
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
        record.calificacionDelCliente,
        record.calificacionACliente,
        record.calificacionClienteDto,
        record.calificacionClienteDTO,
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
      order.calificacionDelCliente ??
      order.calificacionACliente ??
      order.calificacionClienteDto ??
      order.calificacionClienteDTO ??
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
    customerId: getCustomerId(order),
    customerName: getCustomerName(order),
    customerDocument: getCustomerDocument(order),
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
        order.calificacionDelCliente,
        order.calificacionACliente,
        order.calificacionClienteDto,
        order.calificacionClienteDTO,
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

  const record = getRecord(data);
  if (!record) return [];

  const directArray =
    getArray(record.content) ??
    getArray(record.data) ??
    getArray(record.items) ??
    getArray(record.pedidos) ??
    getArray(record.orders) ??
    getArray(record.resultado) ??
    getArray(record.result) ??
    getArray(record.registros);

  if (directArray) return directArray as WorkbenchOrderApiResponse[];

  const nestedObject =
    getRecord(record.data) ??
    getRecord(record.resultado) ??
    getRecord(record.result);

  return nestedObject
    ? getWorkbenchOrders(nestedObject as WorkbenchOrdersApiResponse)
    : [];
}

function getWorkbenchOrderTotalPages(data: WorkbenchOrdersApiResponse): number {
  if (Array.isArray(data)) return 1;

  const record = getRecord(data);
  if (!record) return 1;

  const directTotalPages = getNullableNumber(record.totalPages);
  if (directTotalPages != null) return Math.max(1, directTotalPages);

  const nestedObject =
    getRecord(record.data) ??
    getRecord(record.resultado) ??
    getRecord(record.result);

  if (nestedObject) {
    return getWorkbenchOrderTotalPages(
      nestedObject as WorkbenchOrdersApiResponse,
    );
  }

  return 1;
}

function buildWorkbenchOrderQuery(filters?: WorkbenchFilters) {
  const params = new URLSearchParams();

  if (filters?.sortBy) params.set("orden", filters.sortBy);
  if (filters?.direction) params.set("sentido", filters.direction);
  if (filters?.orderId) params.set("identificador", filters.orderId);
  if (filters?.startDateTime && filters?.endDateTime) {
    params.set("rangoInicio", filters.startDateTime);
    params.set("rangoFin", filters.endDateTime);
  }
  if (filters?.page != null) params.set("page", String(filters.page));
  if (filters?.size != null) params.set("size", String(filters.size));

  return params;
}

function buildRestaurantOrderQuery(filters?: WorkbenchFilters) {
  const params = buildWorkbenchOrderQuery(filters);

  if (filters?.sortBy) params.set("ordenarPor", filters.sortBy);
  if (filters?.direction) params.set("direccion", filters.direction);
  if (filters?.startDateTime) params.set("desde", filters.startDateTime);
  if (filters?.endDateTime) params.set("hasta", filters.endDateTime);

  return params;
}

function appendQuery(endpoint: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${endpoint}?${query}` : endpoint;
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
        return `El backend configurado no tiene disponible PATCH ${data.path}. Actualiza el backend desplegado o apunta NEXT_PUBLIC_API_BASE_URL a un backend que tenga ese endpoint.`;
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
  const encodedRestaurantId = encodeURIComponent(restaurantId);
  const endpoint = appendQuery(
    `/api/local/${encodedRestaurantId}/mesa-trabajo`,
    buildWorkbenchOrderQuery(filters),
  );

  try {
    const response = await api.get<WorkbenchOrdersApiResponse>(
      endpoint,
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
const ALL_ORDERS_PAGE_SIZE = 200;

function shouldTryNextRestaurantOrdersEndpoint(error: unknown) {
  return (
    axios.isAxiosError(error) &&
    (error.response?.status === 404 || error.response?.status === 405)
  );
}

async function fetchRestaurantOrdersPage(
  endpoint: string,
  filters: WorkbenchFilters,
) {
  const response = await api.get<WorkbenchOrdersApiResponse>(
    appendQuery(endpoint, buildRestaurantOrderQuery(filters)),
    { timeout: 15000 },
  );

  return {
    orders: getWorkbenchOrders(response.data),
    totalPages: getWorkbenchOrderTotalPages(response.data),
  };
}

export async function fetchRestaurantOrders(
  restaurantId: string,
  filters?: WorkbenchFilters,
): Promise<WorkbenchOrder[]> {
  const encodedRestaurantId = encodeURIComponent(restaurantId);
  const normalizedFilters: WorkbenchFilters = {
    ...filters,
    startDateTime: filters?.startDateTime ?? ALL_ORDERS_START_DATE_TIME,
    endDateTime: filters?.endDateTime ?? ALL_ORDERS_END_DATE_TIME,
    page: filters?.page ?? 0,
    size: filters?.size ?? ALL_ORDERS_PAGE_SIZE,
  };
  const endpoints = [
    `/api/local/${encodedRestaurantId}/pedidos-global`,
    `/api/local/${encodedRestaurantId}/mesa-trabajo`,
    `/api/local/${encodedRestaurantId}/pedidos`,
    `/api/locales/${encodedRestaurantId}/pedidos`,
  ];
  let lastError: unknown;

  for (const endpoint of endpoints) {
    try {
      const firstPage = await fetchRestaurantOrdersPage(
        endpoint,
        normalizedFilters,
      );
      const orders = [...firstPage.orders];

      for (let page = 1; page < firstPage.totalPages; page += 1) {
        const nextPage = await fetchRestaurantOrdersPage(endpoint, {
          ...normalizedFilters,
          page,
        });
        orders.push(...nextPage.orders);
      }

      return orders
        .map(mapWorkbenchOrder)
        .filter(
          (order) =>
            order.status !== "EN_CARRITO" && order.status !== "ETAPA_DE_PAGO",
        );
    } catch (error) {
      lastError = error;

      if (!shouldTryNextRestaurantOrdersEndpoint(error)) {
        break;
      }
    }
  }

  throw new Error(
    getBackendErrorMessage(lastError, "No se pudieron cargar los pedidos."),
  );
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

export async function getWorkbenchOrderCustomerRating(
  orderId: number,
): Promise<WorkbenchOrderRating | null> {
  try {
    const response = await api.get<WorkbenchOrderRatingApiResponse | null>(
      `/api/pedidos/${encodeURIComponent(orderId.toString())}/calificacion-cliente`,
      { timeout: 10000 },
    );

    return mapWorkbenchRatingFromApi(response.data, orderId);
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      (error.response?.status === 404 || error.response?.status === 405)
    ) {
      return null;
    }

    throw new Error(
      getBackendErrorMessage(
        error,
        "No se pudo cargar la calificacion del cliente.",
      ),
    );
  }
}

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
    const response = await api.post<WorkbenchOrderRatingApiResponse>(
      `/api/pedidos/${encodeURIComponent(orderId.toString())}/calificacion-cliente`,
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
      getBackendErrorMessage(
        error,
        "No se pudo registrar la calificacion del cliente.",
      ),
    );
  }
}
