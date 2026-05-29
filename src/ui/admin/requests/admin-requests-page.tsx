"use client";

import { useMemo, useState } from "react";

import {
  matchesRequestStatusFilter,
  type RequestStatusFilter,
} from "./requests-data";
import RequestsFilters from "./requests-filters";
import RequestsTable from "./requests-table";
import { useRequests } from "./use-requests";

type SortBy = "recent" | "oldest" | "name-asc";

export default function AdminRequestsPage() {
  const { requests, loading, error } = useRequests();

  const [filterRestaurant, setFilterRestaurant] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterStatus, setFilterStatus] =
    useState<RequestStatusFilter>("all");
  const [filterDate, setFilterDate] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recent");

  const filteredRequests = useMemo(() => {
    const restaurantQuery = filterRestaurant.trim().toLowerCase();
    const emailQuery = filterEmail.trim().toLowerCase();

    const filtered = requests.filter((request) => {
      const matchesRestaurant = request.restaurant
        .toLowerCase()
        .includes(restaurantQuery);

      const matchesEmail = request.email.toLowerCase().includes(emailQuery);
      const matchesStatus = matchesRequestStatusFilter(request, filterStatus);
      const requestDate = request.date.slice(0, 10);
      const matchesDate = filterDate ? requestDate === filterDate : true;

      return matchesRestaurant && matchesEmail && matchesStatus && matchesDate;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.restaurant.localeCompare(b.restaurant);
      }

      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      if (sortBy === "oldest") {
        return dateA - dateB;
      }

      return dateB - dateA;
    });
  }, [
    requests,
    filterRestaurant,
    filterEmail,
    filterStatus,
    filterDate,
    sortBy,
  ]);

  if (loading) {
    return (
      <RequestsLayout>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Cargando solicitudes...
          </p>
        </div>
      </RequestsLayout>
    );
  }

  if (error) {
    return (
      <RequestsLayout>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-900 dark:bg-red-950">
          <p className="text-sm font-semibold text-red-700 dark:text-red-200">
            Error: {error}
          </p>
        </div>
      </RequestsLayout>
    );
  }

  return (
    <RequestsLayout>
      <RequestsFilters
        resultCount={filteredRequests.length}
        filterRestaurant={filterRestaurant}
        onFilterRestaurantChange={setFilterRestaurant}
        filterEmail={filterEmail}
        onFilterEmailChange={setFilterEmail}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterDate={filterDate}
        onFilterDateChange={setFilterDate}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      <RequestsTable requests={filteredRequests} />
    </RequestsLayout>
  );
}

function RequestsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
          Solicitudes de locales
        </h1>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Gestion y revision de solicitudes de registro de locales pendientes,
          aceptadas o rechazadas.
        </p>
      </header>

      {children}
    </section>
  );
}
