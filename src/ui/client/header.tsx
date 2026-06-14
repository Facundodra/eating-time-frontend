"use client";

import {
  MagnifyingGlassIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const { imageUrl, profileAlt } = getSessionDisplayData(session);
  const [pendingRatingCount, setPendingRatingCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  // Si estamos en un restaurante, el ícono del carrito apunta a su carrito
  const restaurantMatch = pathname.match(/^\/client\/restaurant\/(\d+)/);
  const cartHref = restaurantMatch
    ? `/client/restaurant/${restaurantMatch[1]}/cart`
    : "/client/cart";

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
    <div className="client-header flex items-center justify-between px-10 py-5">
      <Link href="/" className="logo flex items-center gap-4">
        <Image
          src={EatingTimeLogo}
          alt="Eating Time Logo"
          width={50}
          height={50}
          className="w-[50px]"
        />
        <div className="logo_content">
          <span className="logo_content_name block text-xl font-bold text-slate-950 dark:text-slate-50">
            Eating<span className="text-red-600 dark:text-red-500">Time</span>
          </span>
        </div>
      </Link>

      <div className="search ml-auto hidden md:block">
        <Form
          action="/search"
          className="flex w-fit items-center rounded-full border border-gray-100 bg-gray-100 px-[15px] py-[8px] transition hover:bg-white"
        >
          <input
            type="text"
            placeholder="Buscar..."
            className="min-w-[400px] pr-2 text-sm focus:outline-none"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-full bg-orange-700 p-2 transition hover:bg-orange-800"
          >
            <MagnifyingGlassIcon className="h-4 w-4 text-white" />
          </button>
        </Form>
      </div>

      <div className="theme ml-auto mr-3">
        <ThemeToggle />
      </div>

      <div className="cart mr-3 relative top-[3px]">
        <Link
          href={cartHref}
          className="group h-[37px] w-[37px]   inline-block rounded-full border border-gray-200 p-2 transition hover:bg-orange-800"
        >
          <ShoppingCartIcon className="text-gray-800 transition group-hover:text-white" />
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
              aria-label={`${pendingRatingCount} pedidos pendientes de calificacion`}
              className={`absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white dark:ring-slate-950 ${
                pendingOrdersCount > 0 ? "-left-1 -top-1" : "-right-1 -top-1"
              }`}
            >
              {pendingRatingCount > 9 ? "9+" : pendingRatingCount}
            </span>
          ) : null}
        </span>
        {/* </Link> */}
        <ul className="sub-menu absolute bg-white py-5 px-6 right-0 w-max rounded-md shadow-md hidden group-hover:block">
          <li><Link href="/client/mi-cuenta" className="text-sm text-gray-800 hover:text-orange-700 transition">Mi cuenta</Link></li>
          <li>
            <Link
              href="/client/pending-orders"
              className="text-sm text-gray-800 hover:text-orange-700 transition"
            >
              Pedidos en curso
              {pendingOrdersCount > 0 ? ` (${pendingOrdersCount})` : ""}
            </Link>
          </li>
          <li>
            <Link
              href="/client/order-ratings"
              className="text-sm text-gray-800 hover:text-orange-700 transition"
            >
              Calificación de pedidos
              {pendingRatingCount > 0 ? ` (${pendingRatingCount})` : ""}
            </Link>
          </li>
          <li>
            <Link
              href="/client/claims"
              className="text-sm text-gray-800 hover:text-orange-700 transition"
            >
              Seguimiento de reclamos
            </Link>
          </li>
          <li><Link href="/client/order-history" className="text-sm text-gray-800 hover:text-orange-700 transition">Historial de Pedidos</Link></li>
          <li><Link href="/logout" className="text-sm text-gray-800 hover:text-orange-700 transition">Salir</Link></li>
        </ul>
      </div>
    </div>
  );
}
