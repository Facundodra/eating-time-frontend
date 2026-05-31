"use client";

import {
  ArrowLeftEndOnRectangleIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import Form from "next/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { clearSessionCookies, clearStoredSession } from "@/lib/auth/session-store";
import { logout } from "@/services/auth-service";
import EatingTimeBrand from "@/ui/shared/brand/eating-time-brand";
import ThemeToggle from "../shared/theme/theme-toggle";
import ProfilePicture from "../shared/widgets/profile-picture";

export default function Header() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      clearStoredSession();
      await clearSessionCookies();
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="client-header fixed inset-x-0 top-0 z-40 flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-4 text-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:px-6 lg:flex-nowrap lg:px-10">
      <Link href="/" className="logo flex items-center gap-4">
        <EatingTimeBrand
          iconSize={46}
          iconClassName="h-10 w-10 sm:h-[50px] sm:w-[50px]"
          textClassName="text-xl drop-shadow-sm sm:text-[24px] lg:text-[28px]"
        />
      </Link>

      <div className="search order-last hidden w-full md:block lg:order-none lg:ml-auto lg:max-w-xl lg:flex-1">
        <Form
          action="/search"
          className="flex w-full items-center rounded-full border border-gray-100 bg-gray-100 px-3 py-2 transition hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          <input
            type="text"
            placeholder="Buscar..."
            className="min-w-0 flex-1 bg-transparent pr-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-full bg-orange-700 p-2 transition hover:bg-orange-800"
          >
            <MagnifyingGlassIcon className="h-4 w-4 text-white" />
          </button>
        </Form>
      </div>

      <div className="theme ml-auto lg:ml-3">
        <ThemeToggle />
      </div>

      <div className="cart">
        <Link
          href="/cart"
          className="group inline-block rounded-full border border-gray-200 p-2 transition hover:bg-orange-800 dark:border-slate-800"
        >
          <ShoppingCartIcon className="h-5 w-5 text-gray-800 transition group-hover:text-white dark:text-slate-100" />
        </Link>
      </div>

      <div className="account">
        <Link href="/client/mi-cuenta" className="block">
          <ProfilePicture />
        </Link>
      </div>

      <button
        type="button"
        title="Cerrar sesion"
        aria-label="Cerrar sesion"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-slate-700 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:text-slate-200 dark:hover:border-orange-500/50 dark:hover:text-orange-300"
      >
        <ArrowLeftEndOnRectangleIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
