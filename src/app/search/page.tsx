"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import useDebounce from "@/hooks/use-debounce";
import type { ClientDish, LocalList } from "@/lib/client/types";
import { getDishes, getLocales } from "@/services/client/client-service";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 350);

  const [locals, setLocals] = useState<LocalList[]>([]);
  const [dishes, setDishes] = useState<ClientDish[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!debouncedQ) {
      setLocals([]);
      setDishes([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    Promise.all([
      getLocales().catch(() => {
        // If locales cannot be loaded (likely unauthenticated), fallback to empty list silently
        return [] as LocalList[];
      }),
      getDishes({ q: debouncedQ, pagina: 1, tamano: 12 }).catch((e) => {
        setError((e as Error).message ?? String(e));
        return [] as ClientDish[];
      }),
    ])
      .then(([localsRes, dishesRes]) => {
        setLocals(
          localsRes.filter((l) => l.nombre.toLowerCase().includes(debouncedQ.toLowerCase())),
        );
        setDishes(dishesRes);
      })
      .finally(() => setIsLoading(false));
  }, [debouncedQ]);

  return (
    <main className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <input
          placeholder="Buscar restaurantes o platos..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <section className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-bold">Locales</h2>
            {locals.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500">
                No se encontraron locales.
              </p>
            ) : (
              <div className="space-y-3">
                {locals.map((l) => (
                  <Link key={l.id} href={`/restaurant/${l.id}`} className="block rounded-xl border p-3">
                    <div className="font-bold">{l.nombre}</div>
                    <div className="text-sm text-slate-500">{l.direccion}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-bold">Platos</h2>
            {dishes.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500">
                No se encontraron platos.
              </p>
            ) : (
              <div className="space-y-3">
                {dishes.map((d) => (
                  <Link key={d.id} href={`/client/platos/${d.id}`} className="block rounded-xl border p-3">
                    <div className="font-bold">{d.name}</div>
                    <div className="text-sm text-slate-500">${d.price}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
