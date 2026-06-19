import axios from "axios";

import type { Cart, ClientVoucher, OrderClaim } from "@/lib/client/types";
import { getClientClaims } from "@/services/client/claim-service";
import { clientApi as api } from "@/services/shared/api-client";
import { requireCurrentSession } from "@/services/shared/auth-service";

type VoucherApiResponse = {
  id: number;
  codigo: string;
  descripcion: string | null;
  valor: number;
  creacion: string;
  vencimiento: string | null;
  reclamoId: number;
  pedidoId: number | null;
};

type CartApiResponse = Omit<Cart, "restaurantId"> & {
  localId: number;
};

export type ClientVirtualMoney = {
  vouchers: ClientVoucher[];
};

function mapCart(data: CartApiResponse): Cart {
  const { localId, ...cart } = data;
  return { ...cart, restaurantId: localId };
}

function mapVoucher(
  voucher: VoucherApiResponse,
  claim?: OrderClaim,
): ClientVoucher {
  return {
    id: String(voucher.id),
    code: voucher.codigo,
    description: voucher.descripcion ?? `Compensación por reclamo #${voucher.reclamoId}`,
    amount: voucher.valor,
    createdAt: voucher.creacion,
    expiresAt: voucher.vencimiento,
    claimId: voucher.reclamoId,
    orderId: voucher.pedidoId,
    restaurantName: claim?.localNombre ?? null,
    status: voucher.pedidoId == null ? "disponible" : "aplicado",
  };
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data as
    | { error?: string; message?: string }
    | string
    | undefined;

  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    return data.error ?? data.message ?? fallback;
  }
  return fallback;
}

async function getApprovedClaimsById() {
  const claimsById = new Map<number, OrderClaim>();
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const result = await getClientClaims({
      estado: "APROBADO",
      ordenarPor: "fecha",
      direccion: "desc",
      page,
      size: 100,
    });

    result.claims.forEach((claim) => claimsById.set(claim.id, claim));
    totalPages = result.totalPages;
    page += 1;
  }

  return claimsById;
}

export async function getClientVirtualMoney(): Promise<ClientVirtualMoney> {
  const session = await requireCurrentSession();

  try {
    const [voucherResponse, claimsById] = await Promise.all([
      api.get<VoucherApiResponse[]>(
        `/api/clientes/${session.idTipoUsuario}/vouchers`,
      ),
      getApprovedClaimsById().catch(() => new Map<number, OrderClaim>()),
    ]);

    return {
      vouchers: voucherResponse.data.map((voucher) =>
        mapVoucher(voucher, claimsById.get(voucher.reclamoId)),
      ),
    };
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "No se pudieron cargar tus vouchers."),
    );
  }
}

export async function getAvailableClientVouchers(
  restaurantId: number,
): Promise<ClientVoucher[]> {
  const session = await requireCurrentSession();

  try {
    const response = await api.get<VoucherApiResponse[]>(
      `/api/clientes/${session.idTipoUsuario}/local/${restaurantId}/vouchers`,
    );
    return response.data.map((voucher) => mapVoucher(voucher));
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "No se pudieron cargar los vouchers disponibles."),
    );
  }
}

export async function applyClientVoucher(
  restaurantId: number,
  voucherId: number,
): Promise<Cart> {
  const session = await requireCurrentSession();

  try {
    const response = await api.patch<CartApiResponse>(
      `/api/clientes/${session.idTipoUsuario}/carritos/${restaurantId}/voucher`,
      { voucherId },
    );
    return mapCart(response.data);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "No se pudo aplicar el voucher al carrito."),
    );
  }
}

export async function removeClientVoucher(
  restaurantId: number,
): Promise<Cart> {
  const session = await requireCurrentSession();

  try {
    const response = await api.delete<CartApiResponse>(
      `/api/clientes/${session.idTipoUsuario}/carritos/${restaurantId}/voucher`,
    );
    return mapCart(response.data);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "No se pudo quitar el voucher del carrito."),
    );
  }
}
