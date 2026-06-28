import Link from "next/link";
import {
  ChevronLeftIcon,
  MapPinIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";

import DeliveryPointForm from "./delivery-point-form";
import DeliveryPointList from "./delivery-point-list";

export default function DeliveryPointPage() {
  return (
    <>
      <section className="titulo-seccion w-full">
        <Link
          href="/client/mi-cuenta"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 transition-colors hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-300"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Volver a mi cuenta
        </Link>
        <h1 className="titulo mt-2 text-3xl font-bold text-gray-900 dark:text-white">
          Puntos de entrega
        </h1>
        <p className="descripcion mt-1 text-sm text-gray-500 dark:text-slate-400">
          Gestioná las direcciones para recibir tus pedidos.
        </p>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white shadow-lg dark:bg-slate-900">
          <div className="border-b border-gray-100 px-5 py-5 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                <MapPinIcon className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Mis puntos de entrega
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Direcciones guardadas para realizar pedidos
                </p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <DeliveryPointList />
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-lg dark:bg-slate-900">
          <div className="border-b border-gray-100 px-5 py-5 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                <PlusCircleIcon className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Nuevo punto
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Ingresá los datos de una dirección de entrega.
                </p>
              </div>
            </div>
          </div>
          <DeliveryPointForm />
        </div>
      </section>
    </>
  );
}
