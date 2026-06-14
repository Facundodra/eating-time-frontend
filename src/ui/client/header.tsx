"use client";

import {
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getSessionDisplayData } from "@/lib/shared/auth/session-display";
import type { LoginWebResponse } from "@/lib/shared/auth/types";
import {
  getPendingConfirmationOrdersCount,
  getPendingOrderRatingsCount,
} from "@/services/client/client-service";
import EatingTimeLogo from "@/ui/shared/images/logo.png";
import ThemeToggle from "../shared/theme/theme-toggle";
import ProfilePicture from "../shared/widgets/profile-picture";

export default function Header({ session }: { session: LoginWebResponse }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { imageUrl, profileAlt } = getSessionDisplayData(session);
  const isClientSearchPage = pathname === "/client/search";
  const currentSearchQuery =
    isClientSearchPage ? searchParams.get("q") ?? "" : "";
  const [searchQuery, setSearchQuery] = useState(currentSearchQuery);
  const [pendingRatingCount, setPendingRatingCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  // Si estamos en un restaurante, el ícono del carrito apunta a su carrito
  const restaurantMatch = pathname.match(/^\/client\/restaurant\/(\d+)/);
  const cartHref = restaurantMatch
    ? `/client/restaurant/${restaurantMatch[1]}/cart`
    : "/client/cart";

  useEffect(() => {
    setSearchQuery(currentSearchQuery);
  }, [currentSearchQuery]);

  function toggleSearchFilters() {
    window.dispatchEvent(new CustomEvent("client-search-filters-toggle"));
  }

  useEffect(() => {
    let ignore = false;

    async function loadPendingCounts() {
      try {
        const [ratingsCount, ordersCount] = await Promise.all([
          getPendingOrderRatingsCount(),
          getPendingConfirmationOrdersCount(),
        ]);

        if (!ignore) {
          setPendingRatingCount(ratingsCount);
          setPendingOrdersCount(ordersCount);
        }
      } catch {
        if (!ignore) {
          setPendingRatingCount(0);
          setPendingOrdersCount(0);
        }
      }
    }

    void loadPendingCounts();

    function handlePendingCountsUpdated() {
      void loadPendingCounts();
    }

    window.addEventListener("order-rating-updated", handlePendingCountsUpdated);
    window.addEventListener("pending-orders-updated", handlePendingCountsUpdated);

    return () => {
      ignore = true;
      window.removeEventListener(
        "order-rating-updated",
        handlePendingCountsUpdated,
      );
      window.removeEventListener(
        "pending-orders-updated",
        handlePendingCountsUpdated,
      );
    };
  }, []);

  return (
    <div className="client-header sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white/95 px-10 py-4 text-slate-950 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-50">
      <Link href="/" className="logo flex items-center gap-4">
        <Image
          src={EatingTimeLogo}
          alt="Eating Time Logo"
          width={50}
          height={50}
          className="h-auto w-[50px]"
        />
        <div className="logo_content">
          <span className="logo_content_name client-brand-font block text-xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50">
            Eating<span className="text-red-600 dark:text-red-500">Time</span>
          </span>
        </div>
      </Link>

      <div className="search ml-auto hidden items-center gap-5 md:flex">
        <Form
          action="/client/search"
          className="flex w-fit items-center rounded-full border border-transparent bg-slate-100 px-4 py-2 shadow-sm transition hover:bg-white focus-within:border-orange-200 focus-within:bg-white dark:bg-slate-900 dark:hover:bg-slate-900 dark:focus-within:border-orange-500/30"
        >
          <input
            name="q"
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar..."
            className="min-w-[400px] bg-transparent pr-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500"
          />
          <button
            type="submit"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-white shadow-sm transition hover:bg-orange-700"
          >
            <MagnifyingGlassIcon className="h-4 w-4 text-white" />
          </button>
        </Form>
        {isClientSearchPage ? (
          <button
            type="button"
            aria-label="Mostrar u ocultar filtros de búsqueda"
            onClick={toggleSearchFilters}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-orange-500 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="theme ml-auto mr-3">
        <ThemeToggle />
      </div>

      <div className="cart mr-3 relative top-[3px]">
        <Link
          href={cartHref}
          className="group inline-block h-[37px] w-[37px] rounded-full border border-gray-200 bg-white p-2 shadow-sm transition hover:border-orange-700 hover:bg-orange-700 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-orange-600 dark:hover:bg-orange-600"
        >
          <ShoppingCartIcon className="text-gray-800 transition group-hover:text-white dark:text-slate-200" />
        </Link>
      </div>

      <div className="account relative cursor-pointer group">
        {/* <Link href="/client/mi-cuenta" className="relative bottom-[3px]"> */}
        <span className="relative inline-block">
          <ProfilePicture imageUrl={imageUrl} alt={profileAlt} />
          {pendingOrdersCount > 0 ? (
            <span
              aria-label={`${pendingOrdersCount} pedidos en curso cancelables`}
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white dark:ring-slate-950"
            >
              {pendingOrdersCount > 9 ? "9+" : pendingOrdersCount}
            </span>
          ) : null}
          {pendingRatingCount > 0 ? (
            <span
              aria-label={`${pendingRatingCount} pedidos pendientes de calificación`}
              className={`absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white dark:ring-slate-950 ${
                pendingOrdersCount > 0 ? "-left-1 -top-1" : "-right-1 -top-1"
              }`}
            >
              {pendingRatingCount > 9 ? "9+" : pendingRatingCount}
            </span>
          ) : null}
        </span>
        {/* </Link> */}
        <ul className="sub-menu absolute right-0 hidden w-max rounded-md border border-gray-100 bg-white px-6 py-5 shadow-md group-hover:block dark:border-slate-800 dark:bg-slate-900">
          <li><Link href="/client/mi-cuenta" className="text-sm text-gray-800 transition hover:text-orange-700 dark:text-slate-200 dark:hover:text-orange-400">Mi cuenta</Link></li>
          <li>
            <Link
              href="/client/pending-orders"
              className="text-sm text-gray-800 transition hover:text-orange-700 dark:text-slate-200 dark:hover:text-orange-400"
            >
              Pedidos en curso
              {pendingOrdersCount > 0 ? ` (${pendingOrdersCount})` : ""}
            </Link>
          </li>
          <li>
            <Link
              href="/client/order-ratings"
              className="text-sm text-gray-800 transition hover:text-orange-700 dark:text-slate-200 dark:hover:text-orange-400"
            >
              Calificación de pedidos
              {pendingRatingCount > 0 ? ` (${pendingRatingCount})` : ""}
            </Link>
          </li>
          <li><Link href="/client/order-history" className="text-sm text-gray-800 transition hover:text-orange-700 dark:text-slate-200 dark:hover:text-orange-400">Historial de pedidos</Link></li>
          <li><Link href="/logout" className="text-sm text-gray-800 transition hover:text-orange-700 dark:text-slate-200 dark:hover:text-orange-400">Salir</Link></li>
        </ul>
      </div>
    </div>
  );
}
