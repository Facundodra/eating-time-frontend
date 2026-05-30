import DishesList from "./dishes-list";

export default function DishesPage() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-orange-600 dark:text-orange-300">
          Catalogo
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
          Platos disponibles
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Explora platos de los locales registrados y filtra las opciones para
          encontrar tu proximo pedido.
        </p>
      </div>
      <DishesList />
    </section>
  );
}
