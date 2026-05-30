"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { ClientDish } from "@/lib/client/types";
import { getDish } from "@/services/client/client-service";
import DishesDetailPage from "@/ui/client/dishes/dishes-detail-page";

export default function ClientDishDetailRoute() {
  const params = useParams<{ id: string }>();
  const [dish, setDish] = useState<ClientDish | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDish(params.id)
      .then(setDish)
      .catch((error) =>
        setErrorMessage(
          error instanceof Error ? error.message : "No se pudo cargar el plato.",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [params.id]);

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Cargando plato...
        </p>
      </section>
    );
  }

  if (errorMessage || !dish) {
    return (
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm dark:border-red-500/30 dark:bg-red-500/10">
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">
          {errorMessage || "No se encontro el plato."}
        </p>
      </section>
    );
  }

  return <DishesDetailPage dish={dish} />;
}
