import axios from "axios";

import type { OrderClaim, OrderClaimStatus } from "@/lib/client/types";
import { clientApi as api } from "@/services/shared/api-client";
import { requireCurrentSession } from "@/services/shared/auth-service";

export const MAX_COMPLAINT_NOTE_LENGTH = 300;

export type ClientClaimFilter = {
  pedidoId?: number;
  localId?: number;
  estado?: OrderClaimStatus;
  desde?: string;
  hasta?: string;
  ordenarPor?: "estado" | "fecha";
  direccion?: "asc" | "desc";
  page?: number;
  size?: number;
};

export type ClientClaimRestaurant = {
  id: number;
  name: string;
};

type ClaimApiResponse = {
  id: number;
  descripcion: string;
  nota?: string | null;
  estado: OrderClaimStatus;
  creacion: string;
  pedidoId: number;
  localId?: number | null;
  localNombre?: string | null;
  pedidoTotal?: number | null;
  voucher?: ClaimApiVoucherResponse | null;
  voucherId?: number | string | null;
  codigoVoucher?: string | null;
  voucherCodigo?: string | null;
  voucherCode?: string | null;
  valorVoucher?: number | string | null;
  vencimientoVoucher?: string | null;
  voucherVencimiento?: string | null;
};

type ClaimApiVoucherResponse = {
  id?: number | string | null;
  codigo?: string | null;
  code?: string | null;
  descripcion?: string | null;
  valor?: number | string | null;
  amount?: number | string | null;
  creacion?: string | null;
  vencimiento?: string | null;
  expiresAt?: string | null;
};

type ClaimPageApiResponse = {
  content: ClaimApiResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
};

type LocalApiResponse = {
  id: number;
  nombre: string;
};

type ClaimErrorResponse = {
  error?: string;
  message?: string;
};

function getNumberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function mapClaimFromApi(data: ClaimApiResponse): OrderClaim {
  const voucher = data.voucher;
  const voucherId =
    voucher?.id != null
      ? String(voucher.id)
      : data.voucherId != null
        ? String(data.voucherId)
        : null;
  const voucherCode =
    voucher?.codigo ??
    voucher?.code ??
    data.codigoVoucher ??
    data.voucherCodigo ??
    data.voucherCode ??
    null;
  const voucherAmount = getNumberValue(
    voucher?.valor ?? voucher?.amount ?? data.valorVoucher,
  );
  const voucherExpiresAt =
    voucher?.vencimiento ??
    voucher?.expiresAt ??
    data.vencimientoVoucher ??
    data.voucherVencimiento ??
    null;

  return {
    id: data.id,
    pedidoId: data.pedidoId,
    descripcion: data.descripcion,
    nota: data.nota ?? null,
    estado: data.estado,
    creacion: data.creacion,
    localId: data.localId ?? undefined,
    localNombre: data.localNombre ?? null,
    pedidoTotal:
      data.pedidoTotal != null ? Number(data.pedidoTotal) : null,
    voucherId,
    voucherCode,
    voucherAmount,
    voucherExpiresAt,
  };
}

function getClaimErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ClaimErrorResponse | string | undefined;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data && typeof data === "object") {
      return data.error ?? data.message ?? fallback;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function getClientClaims(
  filter: ClientClaimFilter = {},
): Promise<{ claims: OrderClaim[]; totalPages: number; totalElements: number }> {
  const session = await requireCurrentSession();
  const params: Record<string, string | number> = {};

  if (filter.pedidoId != null) params.pedidoId = filter.pedidoId;
  if (filter.localId != null) params.localId = filter.localId;
  if (filter.estado) params.estado = filter.estado;
  if (filter.desde) params.desde = filter.desde;
  if (filter.hasta) params.hasta = filter.hasta;
  if (filter.ordenarPor) params.ordenarPor = filter.ordenarPor;
  if (filter.direccion) params.direccion = filter.direccion;
  params.page = filter.page ?? 0;
  params.size = filter.size ?? 10;

  try {
    const response = await api.get<ClaimPageApiResponse>(
      `/api/reclamos/cliente/${session.idTipoUsuario}`,
      { params },
    );

    return {
      claims: response.data.content.map(mapClaimFromApi),
      totalPages: response.data.totalPages,
      totalElements: response.data.totalElements,
    };
  } catch (error) {
    throw new Error(
      getClaimErrorMessage(error, "No se pudieron cargar tus reclamos."),
    );
  }
}

export async function getPendingClientClaimsCount(): Promise<number> {
  try {
    const result = await getClientClaims({
      estado: "PENDIENTE",
      page: 0,
      size: 1,
    });

    return result.totalElements;
  } catch {
    return 0;
  }
}

export async function getClientClaimRestaurants(): Promise<ClientClaimRestaurant[]> {
  const session = await requireCurrentSession();

  try {
    const response = await api.get<LocalApiResponse[]>(
      `/api/reclamos/cliente/${session.idTipoUsuario}/locales`,
    );

    return response.data.map((local) => ({
      id: local.id,
      name: local.nombre,
    }));
  } catch (error) {
    throw new Error(
      getClaimErrorMessage(error, "No se pudieron cargar los locales."),
    );
  }
}

export async function getOrderClaim(orderId: number): Promise<OrderClaim | null> {
  const session = await requireCurrentSession();

  try {
    const response = await api.get<ClaimApiResponse>(
      `/api/reclamos/cliente/${session.idTipoUsuario}/pedidos/${orderId}/reclamo`,
    );

    return mapClaimFromApi(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw new Error(
      getClaimErrorMessage(error, "No se pudo cargar el reclamo del pedido."),
    );
  }
}

export async function submitOrderClaim(
  orderId: number,
  nota: string,
): Promise<OrderClaim> {
  const session = await requireCurrentSession();
  const trimmedNota = nota.trim();

  if (!trimmedNota) {
    throw new Error("El motivo del reclamo es obligatorio.");
  }

  if (trimmedNota.length > MAX_COMPLAINT_NOTE_LENGTH) {
    throw new Error(
      `El motivo del reclamo no puede superar los ${MAX_COMPLAINT_NOTE_LENGTH} caracteres.`,
    );
  }

  try {
    const response = await api.post<ClaimApiResponse>(
      `/api/reclamos/cliente/${session.idTipoUsuario}/pedidos/${orderId}/reclamo`,
      { nota: trimmedNota },
    );

    return mapClaimFromApi(response.data);
  } catch (error) {
    throw new Error(
      getClaimErrorMessage(error, "No se pudo enviar el reclamo. Inténtalo nuevamente."),
    );
  }
}

export async function loadOrderClaimsByOrderId(
  orderIds: number[],
): Promise<Record<number, OrderClaim>> {
  if (orderIds.length === 0) {
    return {};
  }

  const results = await Promise.all(
    orderIds.map(async (orderId) => {
      try {
        const claim = await getOrderClaim(orderId);
        return claim ? ([orderId, claim] as const) : null;
      } catch {
        return null;
      }
    }),
  );

  return Object.fromEntries(
    results.filter((entry): entry is readonly [number, OrderClaim] => entry != null),
  );
}
