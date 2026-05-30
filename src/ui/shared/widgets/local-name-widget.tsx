"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BuildingStorefrontIcon } from "@heroicons/react/24/outline";

import { getRestaurantName } from "@/services/client/client-service";

export default function LocalNameWidget({ localId }: { localId: number }) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    getRestaurantName(localId).then(setName).catch(() => {});
  }, [localId]);

  if (!name) return null;

  return (
    <Link
      href={`/client/local/${localId}`}
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition-colors"
    >
      <BuildingStorefrontIcon className="h-4 w-4 shrink-0" />
      {name}
    </Link>
  );
}
