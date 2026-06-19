"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import type { PaymentStatus } from "@/lib/client/types";

const STATUS_CONFIG: Record<
  PaymentStatus,
  { icon: React.ReactNode; title: string; description: string; color: string }
> = {
  approved: {
    icon: <CheckCircleIcon className="w-16 h-16 text-green-500" />,
    title: "¡Pago aprobado!",
    description:
      "Tu pedido fue recibido y está esperando confirmación del local. Te avisaremos cuando sea aceptado.",
    color: "green",
  },
  pending: {
    icon: <ClockIcon className="w-16 h-16 text-yellow-500" />,
    title: "Pago pendiente",
    description:
      "El pago está siendo procesado. Cuando se confirme, el local recibirá tu pedido.",
    color: "yellow",
  },
  failure: {
    icon: <XCircleIcon className="w-16 h-16 text-red-500" />,
    title: "Pago rechazado",
    description:
      "Hubo un problema con el pago. Podés reintentar desde tu carrito.",
    color: "red",
  },
};

export default function PaymentResultPage() {
  const params = useSearchParams();

  const rawStatus = params.get("paymentStatus");
  const localId = params.get("localId");
  const pedidoId = params.get("pedidoId");

  // MercadoPago envía "rejected" para pagos fallidos; lo normalizamos a "failure"
  const normalized = rawStatus?.split(",")[0] ?? "";
  const parsedStatus = (normalized === "rejected" ? "failure" : normalized) as PaymentStatus;
  const status = parsedStatus in STATUS_CONFIG ? parsedStatus : null;

  if (!status) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-sm dark:text-slate-400">Estado de pago no reconocido.</p>
        <Link href="/client" className="mt-4 block text-orange-700 text-sm font-semibold hover:underline dark:text-orange-400">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const { icon, title, description, color } = STATUS_CONFIG[status];

  const colorMap = {
    green: "bg-green-50 border-green-200 dark:border-green-500/30 dark:bg-green-500/10",
    yellow: "bg-yellow-50 border-yellow-200 dark:border-yellow-500/30 dark:bg-yellow-500/10",
    red: "bg-red-50 border-red-200 dark:border-red-500/30 dark:bg-red-500/10",
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className={`rounded-2xl border p-8 text-center space-y-4 ${colorMap[color as keyof typeof colorMap]}`}>
        <div className="flex justify-center">{icon}</div>

        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">{title}</h1>
        <p className="text-sm text-gray-600 dark:text-slate-300">{description}</p>

        {pedidoId && (
          <p className="text-xs text-gray-400 dark:text-slate-500">Pedido #{pedidoId}</p>
        )}
      </div>

      {/* Acciones según estado */}
      <div className="mt-6 space-y-3">
        {status === "failure" && localId && (
          <Link
            href={`/client/restaurant/${localId}/cart`}
            className="block w-full text-center bg-orange-700 hover:bg-orange-800 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            Reintentar pago
          </Link>
        )}

        <Link
          href="/client"
          className="block w-full text-center border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm px-6 py-3 rounded-xl transition-colors dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
