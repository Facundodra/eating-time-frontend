"use client";

import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  StarIcon,
  WalletIcon,
  UserCircleIcon,
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
import { getPendingClientClaimsCount } from "@/services/client/claim-service";
import { getAvailableClientVouchersCount } from "@/services/client/virtual-money-service";
import EatingTimeLogo from "@/ui/shared/images/logo.png";
import ThemeToggle from "../shared/theme/theme-toggle";
import ProfilePicture from "../shared/widgets/profile-picture";

const menuLinkClass =
  "flex items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-800 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800";
const menuIconClass = "h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400";
const clientNotificationEvents = [
  "order-rating-updated",
  "pending-orders-updated",
  "client-claims-updated",
  "client-wallet-updated",
];

type PendingBadgeTone = "orders" | "ratings" | "claims" | "wallet";

const pendingBadgeToneClasses: Record<PendingBadgeTone, string> = {
  orders: "bg-orange-600 dark:bg-orange-500",
  ratings: "bg-sky-600 dark:bg-sky-500",
  claims: "bg-violet-600 dark:bg-violet-500",
  wallet: "bg-emerald-600 dark:bg-emerald-500",
};

function formatPendingCount(count: number) {
  return count > 9 ? "9+" : count;
}

function PendingCountBadge({
  count,
  label,
  tone,
}: {
  count: number;
  label: string;
  tone: PendingBadgeTone;
}) {
  if (count <= 0) return null;

  return (
    <span
      aria-label={`${count} ${label}`}
      className={`ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold leading-none text-white ${pendingBadgeToneClasses[tone]}`}
    >
      {formatPendingCount(count)}
    </span>
  );
}

export default function Header({ session }: { session: LoginWebResponse }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { imageUrl, profileAlt } = getSessionDisplayData(session);
  const isClientDishesPage = pathname === "/client/dishes";
  const currentSearchQuery = isClientDishesPage
    ? searchParams.get("q") ?? ""
    : "";
  const [searchQuery, setSearchQuery] = useState(currentSearchQuery);
  const [navigationMenuOpen, setNavigationMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [pendingRatingCount, setPendingRatingCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0);
  const [availableVouchersCount, setAvailableVouchersCount] = useState(0);
  const pendingMenuCount =
    pendingRatingCount +
    pendingOrdersCount +
    pendingClaimsCount +
    availableVouchersCount;

  const restaurantMatch = pathname.match(/^\/client\/restaurant\/(\d+)/);
  const cartHref = restaurantMatch
    ? `/client/restaurant/${restaurantMatch[1]}/cart`
    : "/client/cart";

  useEffect(() => {
    setSearchQuery(currentSearchQuery);
  }, [currentSearchQuery]);

  function closeHeaderMenus() {
    setNavigationMenuOpen(false);
    setAccountMenuOpen(false);
  }

  function toggleNavigationMenu() {
    setNavigationMenuOpen((open) => !open);
    setAccountMenuOpen(false);
  }

  function toggleAccountMenu() {
    setAccountMenuOpen((open) => !open);
    setNavigationMenuOpen(false);
  }

  useEffect(() => {
    closeHeaderMenus();
  }, [pathname]);

  useEffect(() => {
    let ignore = false;

    async function loadPendingCounts() {
      try {
        const [ratingsCount, ordersCount, claimsCount, vouchersCount] =
          await Promise.all([
            getPendingOrderRatingsCount().catch(() => 0),
            getPendingConfirmationOrdersCount().catch(() => 0),
            getPendingClientClaimsCount(),
            getAvailableClientVouchersCount(),
          ]);

        if (!ignore) {
          setPendingRatingCount(ratingsCount);
          setPendingOrdersCount(ordersCount);
          setPendingClaimsCount(claimsCount);
          setAvailableVouchersCount(vouchersCount);
        }
      } catch {
        if (!ignore) {
          setPendingRatingCount(0);
          setPendingOrdersCount(0);
          setPendingClaimsCount(0);
          setAvailableVouchersCount(0);
        }
      }
    }

    void loadPendingCounts();

    function handlePendingCountsUpdated() {
      void loadPendingCounts();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadPendingCounts();
      }
    }

    clientNotificationEvents.forEach((eventName) => {
      window.addEventListener(eventName, handlePendingCountsUpdated);
    });
    window.addEventListener("focus", handlePendingCountsUpdated);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      ignore = true;
      clientNotificationEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handlePendingCountsUpdated);
      });
      window.removeEventListener("focus", handlePendingCountsUpdated);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="client-header sticky top-0 z-40 flex items-center gap-2 border-b border-gray-200 bg-white/95 px-3 py-3 text-slate-950 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-50 sm:gap-3 md:px-10 md:py-4">
      <Link href="/" className="logo flex shrink-0 items-center gap-3 md:gap-4">
        <Image
          src={EatingTimeLogo}
          alt="Eating Time Logo"
          width={50}
          height={50}
          className="h-auto w-11 md:w-[50px]"
        />
        <div className="logo_content hidden md:block">
          <span className="logo_content_name client-brand-font block text-xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50">
            Eating<span className="text-red-600 dark:text-red-500">Time</span>
          </span>
        </div>
      </Link>

      <Form
        action="/client/dishes"
        className="flex min-w-0 flex-1 items-center rounded-full border border-transparent bg-slate-100 px-3 py-2 shadow-sm transition focus-within:border-transparent focus-within:bg-white dark:bg-slate-900 dark:focus-within:border-transparent dark:focus-within:bg-slate-900 md:hidden"
      >
        <input
          name="q"
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Buscar..."
          className="min-w-0 flex-1 rounded-full bg-transparent pr-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none dark:bg-transparent dark:text-white dark:placeholder:text-slate-500"
        />
        <button
          type="submit"
          aria-label="Buscar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white shadow-sm transition hover:bg-orange-700"
        >
          <MagnifyingGlassIcon className="h-4 w-4 text-white" />
        </button>
      </Form>

      <div className="search hidden min-w-0 flex-1 items-center justify-center px-8 md:flex">
        <Form
          action="/client/dishes"
          className="flex w-[min(42vw,520px)] items-center rounded-full border border-transparent bg-slate-100 px-4 py-2 shadow-sm transition hover:bg-white focus-within:border-transparent focus-within:bg-white dark:bg-slate-900 dark:hover:bg-slate-900 dark:focus-within:border-transparent dark:focus-within:bg-slate-900"
        >
          <input
            name="q"
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar..."
            className="min-w-0 flex-1 rounded-full bg-transparent pr-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none dark:bg-transparent dark:text-white dark:placeholder:text-slate-500"
          />
          <button
            type="submit"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-white shadow-sm transition hover:bg-orange-700"
          >
            <MagnifyingGlassIcon className="h-4 w-4 text-white" />
          </button>
        </Form>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="cart relative shrink-0">
          <Link
            href={cartHref}
            className="group grid h-[37px] w-[37px] place-items-center rounded-full border border-gray-200 bg-white p-2 shadow-sm transition hover:border-gray-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            <ShoppingCartIcon className="h-5 w-5 text-gray-800 transition dark:text-slate-200" />
          </Link>
        </div>

        <div className="account relative shrink-0">
          <button
            type="button"
            aria-expanded={accountMenuOpen}
            aria-label="Abrir opciones de cuenta"
            onClick={toggleAccountMenu}
            className="relative block rounded-full focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 dark:focus:ring-slate-700 dark:focus:ring-offset-slate-950"
          >
            <ProfilePicture imageUrl={imageUrl} alt={profileAlt} />
          </button>

          {accountMenuOpen ? (
            <nav className="absolute right-0 top-[calc(100%+12px)] z-50 w-56 rounded-md border border-gray-100 bg-white px-5 py-4 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/client/mi-cuenta"
                    onClick={closeHeaderMenus}
                    className={menuLinkClass}
                  >
                    <UserCircleIcon className={menuIconClass} />
                    Mi cuenta
                  </Link>
                </li>
                <li>
                  <Link
                    href="/client/order-history"
                    onClick={closeHeaderMenus}
                    className={menuLinkClass}
                  >
                    <ClipboardDocumentListIcon className={menuIconClass} />
                    Historial de pedidos
                  </Link>
                </li>
                <li>
                  <Link
                    href="/logout"
                    onClick={closeHeaderMenus}
                    className={menuLinkClass}
                  >
                    <ArrowRightOnRectangleIcon className={menuIconClass} />
                    Salir
                  </Link>
                </li>
              </ul>
            </nav>
          ) : null}
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            aria-expanded={navigationMenuOpen}
            aria-label="Abrir menu de navegacion"
            onClick={toggleNavigationMenu}
            className="relative grid h-[37px] w-[37px] place-items-center rounded-md text-gray-800 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-slate-700 dark:focus:ring-offset-slate-950"
          >
            <Bars3Icon className="h-5 w-5" />
            {pendingMenuCount > 0 && !navigationMenuOpen ? (
              <span
                aria-label={`${pendingMenuCount} novedades pendientes`}
                className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-600 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white dark:bg-cyan-500 dark:ring-slate-950"
              >
                {formatPendingCount(pendingMenuCount)}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {navigationMenuOpen ? (
        <nav className="absolute right-0 top-full z-50 h-[calc(100vh-69px)] w-[min(72vw,280px)] border-l border-gray-100 bg-white px-5 py-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 md:h-[calc(100vh-83px)] md:w-72 md:px-6">
          <ul className="space-y-1">
            <li>
              <Link
                href="/client/mi-cuenta"
                onClick={closeHeaderMenus}
                className={menuLinkClass}
              >
                <UserCircleIcon className={menuIconClass} />
                Mi cuenta
              </Link>
            </li>
            <li>
              <Link
                href="/client/pending-orders"
                onClick={closeHeaderMenus}
                className={`${menuLinkClass} justify-between`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <ClockIcon className={menuIconClass} />
                  Pedidos en curso
                </span>
                <PendingCountBadge
                  count={pendingOrdersCount}
                  label="pedidos en curso"
                  tone="orders"
                />
              </Link>
            </li>
            <li>
              <Link
                href="/client/order-ratings"
                onClick={closeHeaderMenus}
                className={`${menuLinkClass} justify-between`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <StarIcon className={menuIconClass} />
                  Calificación de pedidos
                </span>
                <PendingCountBadge
                  count={pendingRatingCount}
                  label="pedidos pendientes de calificacion"
                  tone="ratings"
                />
              </Link>
            </li>
            <li>
              <Link
                href="/client/claims"
                onClick={closeHeaderMenus}
                className={`${menuLinkClass} justify-between`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <ChatBubbleLeftRightIcon className={menuIconClass} />
                  Seguimiento de reclamos
                </span>
                <PendingCountBadge
                  count={pendingClaimsCount}
                  label="reclamos pendientes"
                  tone="claims"
                />
              </Link>
            </li>
            <li>
              <Link
                href="/client/mi-cuenta/dinero-virtual"
                onClick={closeHeaderMenus}
                className={`${menuLinkClass} justify-between`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <WalletIcon className={menuIconClass} />
                  Mi billetera
                </span>
                <PendingCountBadge
                  count={availableVouchersCount}
                  label="vouchers disponibles"
                  tone="wallet"
                />
              </Link>
            </li>
            <li>
              <Link
                href="/client/order-history"
                onClick={closeHeaderMenus}
                className={menuLinkClass}
              >
                <ClipboardDocumentListIcon className={menuIconClass} />
                Historial de pedidos
              </Link>
            </li>
            <li>
              <ThemeToggle variant="menu" />
            </li>
            <li>
              <Link
                href="/logout"
                onClick={closeHeaderMenus}
                className={menuLinkClass}
              >
                <ArrowRightOnRectangleIcon className={menuIconClass} />
                Salir
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
