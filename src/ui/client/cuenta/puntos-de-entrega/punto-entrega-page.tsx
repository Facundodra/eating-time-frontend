import Link from "next/link";
import PuntoEntregaForm from "./punto-entrega-form";
import PuntoEntregaList from "./punto-entrega-list";

export default function PuntoEntregaPage() {
  return (
    <>
      {/* Seccion titular */}
      <section className="titulo-seccion w-full">
        <span className="ruta text-xs text-gray-400">
          <Link href={"/client"}>Inicio</Link> /{" "}
          <Link href={"/client/mi-cuenta"}>Mi cuenta</Link> / Puntos de entrega
        </span>
        <h1 className="titulo text-3xl font-bold text-gray-900 mt-2">
          Puntos de entrega
        </h1>
        <p className="descripcion text-sm text-gray-500 mt-1">
          Gestiona las direcciones para recibir pedidos.
        </p>
      </section>      
      <section className="listado-puntos w-full mt-6 flex flex-wrap !gap-0">
        <div className="col w-[100%] lg:w-[49%] mr-[2%] lg:mr-2% mb-6 lg:mb-0 bg-white rounded-2xl shadow-lg">
            {/* Seccion listado */}
            <h2 className="text-xl font-bold text-gray-900 mb-1 pt-5 px-5">
                Mis puntos de entrega
            </h2>
            <p className="text-sm text-gray-500 pb-2 px-5">
                Direcciones guardadas para realizar pedidos
            </p>
            <hr className="text-gray-200 my-4"></hr>
            <div className="lista p-5">
              <PuntoEntregaList></PuntoEntregaList>
            </div>
        </div>
        <div className="col w-[100%] lg:w-[48%] bg-white rounded-2xl shadow-lg">
            {/* Seccion formulario */}
            <h2 className="text-xl font-bold text-gray-900 mb-1 pt-5 px-5">
                Nuevo punto
            </h2>
            <p className="text-sm text-gray-500 pb-2 px-5">
                Ingresa los datos de una direccion de entrega.
            </p>
            <hr className="text-gray-200 my-4"></hr>
            <PuntoEntregaForm></PuntoEntregaForm>
        </div>
      </section>
      
    </>
  );
}
