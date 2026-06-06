"use client";

import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAsyncData } from "@/hooks/shared/use-async-data";
import type { Client, Restaurant, User } from "@/lib/admin/users/types";
import { getUsers, blockUser, unblockUser } from "@/services/admin/gestion-service";
import LoadingIndicator from "@/ui/shared/feedback/loading-indicator";
import PanelError from "@/ui/shared/feedback/panel-error";

type UserType = "clientes" | "locales" | "admins";
type StatusFilter = "all" | "active" | "blocked" | "deleted";
type SortBy = "recent" | "oldest" | "name-asc";

const PAGE_SIZE = 20;

const TYPE_LABELS: Record<UserType, string> = {
  clientes: "Clientes",
  locales: "Locales",
  admins: "Administradores",
};

function getUserStatus(user: User): "active" | "blocked" | "deleted" {
  if (user.eliminacion) return "deleted";
  if (user.bloqueo) return "blocked";
  return "active";
}

function StatusBadge({ user }: { user: User }) {
  const status = getUserStatus(user);
  const map = {
    active: { label: "Activo", cls: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" },
    blocked: { label: "Bloqueado", cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
    deleted: { label: "Eliminado", cls: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" },
  };
  const { label, cls } = map[status];
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{label}</span>;
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} className="h-8 w-8 rounded-full object-cover shrink-0" />
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function formatDate(date: Date) {
  return date.toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCalificacion(cal: number | null) {
  return cal !== null ? `${cal.toFixed(1)} ★` : "—";
}

export default function AdminUsersList() {
  const [allUsers, setAllUsers] = useState<(User | Client | Restaurant)[]>([]);
  const [type, setType] = useState<UserType>("clientes");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [page, setPage] = useState(1);
  const [blockingId, setBlockingId] = useState<number | null>(null);
  const [blockError, setBlockError] = useState<string | null>(null);

  useEffect(() => { setPage(1); }, [type, search, filterStatus, sortBy]);

  // Cada cambio de tipo consulta backend otra vez, pero mantiene filtros y
  // estructura visible mientras la tabla muestra su propio loader/error.
  const loadUsers = useCallback(() => getUsers({ size: -1 }, type), [type]);
  const {
    error: loadError,
    isLoading,
    reload,
  } = useAsyncData(loadUsers, {
    onSuccess: (result) => {
      setAllUsers(result.users);
    },
  });

  async function handleToggleBlock(user: User) {
    setBlockingId(user.usuarioId);
    setBlockError(null);
    try {
      if (user.bloqueo) {
        await unblockUser(user.usuarioId);
        setAllUsers((prev) =>
          prev.map((u) => u.usuarioId === user.usuarioId ? { ...u, bloqueo: null } : u)
        );
      } else {
        await blockUser(user.usuarioId);
        setAllUsers((prev) =>
          prev.map((u) => u.usuarioId === user.usuarioId ? { ...u, bloqueo: new Date() } : u)
        );
      }
    } catch (err) {
      setBlockError(err instanceof Error ? err.message : "Error al actualizar el usuario.");
    } finally {
      setBlockingId(null);
    }
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = allUsers.filter((u) => {
      if (q && !u.nombre.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (filterStatus !== "all" && getUserStatus(u) !== filterStatus) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "name-asc") return a.nombre.localeCompare(b.nombre);
      const diff = a.creacion.getTime() - b.creacion.getTime();
      return sortBy === "oldest" ? diff : -diff;
    });
  }, [allUsers, search, filterStatus, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="mx-auto w-full space-y-6 px-4 py-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {(Object.keys(TYPE_LABELS) as UserType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={clsx(
              "-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition",
              type === t
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
            )}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="blocked">Bloqueados</option>
          <option value="deleted">Eliminados</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <option value="recent">Más recientes</option>
          <option value="oldest">Más antiguos</option>
          <option value="name-asc">Nombre A→Z</option>
        </select>

        {!isLoading && !loadError && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {filteredUsers.length} {filteredUsers.length === 1 ? "resultado" : "resultados"}
          </span>
        )}
      </div>

      {/* Block error */}
      {blockError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-900 dark:bg-red-950">
          <p className="text-sm font-semibold text-red-700 dark:text-red-200">Error: {blockError}</p>
        </div>
      )}

      {/* States */}
      {isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <LoadingIndicator label="Cargando usuarios..." />
        </div>
      )}

      {!isLoading && loadError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-900 dark:bg-red-950">
          <PanelError
            message={loadError.message ?? "Error al cargar usuarios."}
            onRetry={reload}
          />
        </div>
      )}

      {!isLoading && !loadError && filteredUsers.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {search || filterStatus !== "all"
              ? "No hay usuarios que coincidan con los filtros."
              : "No hay usuarios registrados."}
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !loadError && pagedUsers.length > 0 && (
        <>
          <UsersTable users={pagedUsers} type={type} onToggleBlock={handleToggleBlock} blockingId={blockingId} />

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </section>
  );
}

function UsersTable({
  users,
  type,
  onToggleBlock,
  blockingId,
}: {
  users: (User | Client | Restaurant)[];
  type: UserType;
  onToggleBlock: (user: User) => void;
  blockingId: number | null;
}) {
  const showPhoto = type === "clientes" || type === "locales";
  const showCalificacion = type === "clientes" || type === "locales";
  const showDireccion = type === "locales";
  const showServicio = type === "locales";
  const showActions = type !== "admins";

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-white text-xs uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="px-5 py-4 font-bold">Usuario</th>
              <th className="px-5 py-4 font-bold">Email</th>
              <th className="px-5 py-4 font-bold">Teléfono</th>
              {showDireccion && <th className="px-5 py-4 font-bold">Dirección</th>}
              {showCalificacion && <th className="px-5 py-4 font-bold">Calificación</th>}
              {showServicio && <th className="px-5 py-4 font-bold">Servicio</th>}
              <th className="px-5 py-4 font-bold">Registro</th>
              <th className="px-5 py-4 font-bold">Estado</th>
              {showActions && <th className="px-5 py-4 font-bold">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-950">
            {users.map((user) => {
              const client = type === "clientes" ? (user as Client) : null;
              const restaurant = type === "locales" ? (user as Restaurant) : null;
              const isBlocking = blockingId === user.usuarioId;

              return (
                <tr key={user.usuarioId} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/70">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {showPhoto && (
                        <Avatar
                          url={client?.urlFoto ?? restaurant?.urlFoto ?? null}
                          name={user.nombre}
                        />
                      )}
                      <span className="font-bold text-slate-900 dark:text-white">{user.nombre}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{user.email}</td>

                  <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                    {user.telefono ?? <span className="text-slate-400">—</span>}
                  </td>

                  {showDireccion && (
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                      {restaurant?.direccion ?? <span className="text-slate-400">—</span>}
                    </td>
                  )}

                  {showCalificacion && (
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                      {formatCalificacion(client?.calificacion ?? restaurant?.calificacion ?? null)}
                    </td>
                  )}

                  {showServicio && (
                    <td className="px-5 py-4">
                      {restaurant?.estadoServicio == null ? (
                        <span className="text-slate-400">—</span>
                      ) : restaurant.estadoServicio ? (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-500/10 dark:text-green-400">
                          Abierto
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Cerrado
                        </span>
                      )}
                    </td>
                  )}

                  <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                    {formatDate(user.creacion)}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge user={user} />
                  </td>

                  {showActions && (
                    <td className="px-5 py-4">
                      {user.eliminacion ? (
                        <span className="text-slate-400">—</span>
                      ) : user.bloqueo ? (
                        <button
                          onClick={() => onToggleBlock(user)}
                          disabled={isBlocking}
                          className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold cursor-pointer text-slate-700 transition hover:bg-slate-200 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          {isBlocking ? "..." : "Desbloquear"}
                        </button>
                      ) : (
                        <button
                          onClick={() => onToggleBlock(user)}
                          disabled={isBlocking}
                          className="rounded-lg border cursor-pointer border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50 dark:border-amber-800 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
                        >
                          {isBlocking ? "..." : "Bloquear"}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Pagination({ page, totalPages, onPageChange }: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  const pages = buildPageRange(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="rounded-lg border border-gray-200 p-2 transition-colors hover:border-orange-600 disabled:opacity-40"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-1 text-slate-400">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={clsx(
              "h-9 w-9 rounded-lg border text-sm font-medium transition-colors",
              p === page
                ? "border-orange-600 bg-orange-600 text-white"
                : "border-gray-200 text-gray-600 hover:border-orange-600",
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="rounded-lg border border-gray-200 p-2 transition-colors hover:border-orange-600 disabled:opacity-40"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function buildPageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);

  return pages;
}
