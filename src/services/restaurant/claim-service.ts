import axios from "axios";

import type {
  ClaimOrderItem,
  ClaimVoucher,
  ClaimStatus,
  RestaurantClaim,
  RestaurantClaimDetail,
  RestaurantClaimsResponse,
} from "@/lib/restaurant/claim/types";
import { clientApi as api } from "@/services/shared/api-client";

type ClaimApiStatus = "PENDIENTE" | "APROBADO" | "RECHAZADO";

type ClaimApiResponse = {
  id: number;
  descripcion: string;
  estado: ClaimApiStatus;
  creacion: string;
  pedidoId: number;
  pedidoTotal?: number | null;
  pedidoEstado?: string | null;
  pedidoCreacion?: string | null;
  clienteId?: number | null;
  clienteNombre?: string | null;
  clienteEmail?: string | null;
  items?: ClaimApiItemResponse[] | null;
  voucher?: ClaimApiVoucherResponse | null;
  nota?: string | null;
  valorVoucher?: number | null;
};

type ClaimApiItemResponse = {
  plato: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

type ClaimApiVoucherResponse = {
  id?: number | null;
  codigo?: string | null;
  descripcion?: string | null;
  valor?: number | null;
  creacion?: string | null;
  vencimiento?: string | null;
};

type ClaimActionRequest = {
  nota?: string;
  valorVoucher?: number;
};

type ClaimErrorResponse =
  | string
  | {
      error?: string;
      message?: string;
      detail?: string;
      errors?: Record<string, string | string[]>;
    };

const claimStatusByApiStatus: Record<ClaimApiStatus, ClaimStatus> = {
  PENDIENTE: "pending",
  APROBADO: "resolved",
  RECHAZADO: "rejected",
};

function mapApiClaimItem(item: ClaimApiItemResponse, index: number): ClaimOrderItem {
  return {
    id: `${index}-${item.plato}`,
    dishName: item.plato,
    quantity: item.cantidad,
    unitPrice: item.precioUnitario,
    subtotal: item.subtotal,
  };
}

function mapApiVoucher(voucher: ClaimApiVoucherResponse | null | undefined) {
  if (!voucher) {
    return null;
  }

  return {
    id: voucher.id != null ? String(voucher.id) : "",
    code: voucher.codigo ?? "",
    description: voucher.descripcion ?? "Voucher por reclamo aprobado",
    amount: voucher.valor ?? 0,
    createdAt: voucher.creacion ?? "",
    expiresAt: voucher.vencimiento ?? "",
  } satisfies ClaimVoucher;
}

function mapApiClaim(claim: ClaimApiResponse): RestaurantClaim {
  const status = claimStatusByApiStatus[claim.estado] ?? "pending";

  return {
    id: String(claim.id),
    orderId: String(claim.pedidoId),
    customerId: claim.clienteId != null ? String(claim.clienteId) : "",
    customerName: claim.clienteNombre ?? "Cliente no disponible",
    customerEmail: claim.clienteEmail ?? "Correo no disponible",
    reason: "Reclamo del pedido",
    detail: claim.descripcion,
    status,
    createdAt: claim.creacion,
    updatedAt: claim.creacion,
    amount: claim.pedidoTotal ?? 0,
    response: claim.nota ?? "",
    resolutionAction:
      status === "resolved" ? "voucher" : status === "rejected" ? "rejection" : null,
    voucherAmount: claim.valorVoucher ?? null,
  };
}

function mapApiClaimDetail(claim: ClaimApiResponse): RestaurantClaimDetail {
  return {
    claim: mapApiClaim(claim),
    order: {
      id: String(claim.pedidoId),
      createdAt: claim.pedidoCreacion ?? "",
      status: claim.pedidoEstado ?? "Estado no disponible",
      total: claim.pedidoTotal ?? 0,
      items: (claim.items ?? []).map(mapApiClaimItem),
    },
    voucher: mapApiVoucher(claim.voucher),
  };
}

function getClaimErrorMessage(error: unknown, fallbackMessage: string) {
  if (!axios.isAxiosError<ClaimErrorResponse>(error)) {
    return fallbackMessage;
  }

  const data = error.response?.data;
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return fallbackMessage;
  }

  const fieldError = data?.errors
    ? Object.values(data.errors)
        .flat()
        .find((message) => message.trim().length > 0)
    : null;

  return data?.error ?? data?.message ?? data?.detail ?? fieldError ?? fallbackMessage;
}

export async function getRestaurantClaims(
  restaurantId: string,
): Promise<RestaurantClaimsResponse> {
  try {
    const response = await api.get<ClaimApiResponse[]>(
      `/api/reclamos/local/${encodeURIComponent(restaurantId)}`,
    );

    return {
      restaurantId,
      claims: response.data.map(mapApiClaim),
    };
  } catch (error) {
    throw new Error(
      getClaimErrorMessage(error, "No se pudieron cargar los reclamos."),
    );
  }
}

export async function getRestaurantClaimDetail(
  _restaurantId: string,
  claimId: string,
): Promise<RestaurantClaimDetail> {
  try {
    const response = await api.get<ClaimApiResponse>(
      `/api/reclamos/${encodeURIComponent(claimId)}`,
    );

    return mapApiClaimDetail(response.data);
  } catch (error) {
    throw new Error(
      getClaimErrorMessage(error, "No se pudo cargar el detalle del reclamo."),
    );
  }
}

export async function approveRestaurantClaim(
  claimId: string,
  body: ClaimActionRequest,
): Promise<void> {
  try {
    await api.patch(
      `/api/reclamos/${encodeURIComponent(claimId)}/aprobar`,
      body,
    );
  } catch (error) {
    throw new Error(
      getClaimErrorMessage(error, "No se pudo aprobar el reclamo."),
    );
  }
}

export async function rejectRestaurantClaim(
  claimId: string,
  body: Pick<ClaimActionRequest, "nota">,
): Promise<void> {
  try {
    await api.patch(
      `/api/reclamos/${encodeURIComponent(claimId)}/rechazar`,
      body,
    );
  } catch (error) {
    throw new Error(
      getClaimErrorMessage(error, "No se pudo rechazar el reclamo."),
    );
  }
}
