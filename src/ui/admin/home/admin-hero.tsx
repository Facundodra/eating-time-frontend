export default function AdminHero() {
  return (
    <div className="rounded-3xl bg-gradient-to-r from-orange-600 to-orange-400 px-6 py-8 text-white shadow-xl shadow-orange-500/10 md:px-8">
      <h2 className="text-xl font-bold md:text-2xl">
        Gestion administrativa de Eating Time
      </h2>
      <p className="mt-4 max-w-3xl text-sm font-medium leading-6 text-orange-50">
        Desde este panel el administrador accede a la gestion de usuarios
        registrados, la revision de solicitudes de locales y el bloqueo o
        desbloqueo de cuentas.
      </p>
    </div>
  );
}
