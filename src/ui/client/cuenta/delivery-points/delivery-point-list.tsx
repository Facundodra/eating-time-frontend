"use client";

import { useEffect, useState } from "react";

import { getDeliveryPoints } from "@/services/client/client-service";
import type { DeliveryPoint } from "@/lib/client/types";

import { MapPinIcon } from "@heroicons/react/24/outline";

function DeliveryPointSkeleton() {
  return (
    <ul className="space-y-3">
      {[1, 2, 3].map((i) => (
        <li key={i} className="rounded-xl border border-gray-200 bg-white px-5 py-4 flex items-center animate-pulse">
          <div className="w-5 h-5 rounded-full bg-gray-200 mr-3 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function DeliveryPointList() {
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDeliveryPoints()
      .then(setDeliveryPoints)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error al cargar"),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DeliveryPointSkeleton />;

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
        {error}
      </p>
    );
  }

  if (deliveryPoints.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No tenés puntos de entrega guardados todavía.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {deliveryPoints.map((deliveryPoint) => (
        <li
          key={deliveryPoint.id}
          className="rounded-xl border border-gray-200 bg-white px-5 py-4 flex items-start gap-3 dark:border-slate-700 dark:bg-slate-800/50"
        >
          <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {deliveryPoint.calle} {deliveryPoint.numero}
              {deliveryPoint.nroApto ? `, Apto ${deliveryPoint.nroApto}` : ""}
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              {deliveryPoint.localidad}
            </p>
            {deliveryPoint.indicaciones && (
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {deliveryPoint.indicaciones}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
