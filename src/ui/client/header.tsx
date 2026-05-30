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
    <div className="client-header flex items-center justify-between border-b border-gray-200 bg-white px-10 py-5 text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
      <Link href="/" className="logo flex items-center gap-4">
        <EatingTimeBrand
          iconSize={50}
          iconClassName="h-[50px] w-[50px]"
          textClassName="text-[28px] drop-shadow-sm"
        />
      </Link>

      <div className="search ml-auto hidden md:block">
        <Form
          action="/search"
          className="flex w-fit items-center rounded-full border border-gray-100 bg-gray-100 px-[15px] py-[8px] transition hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          <input
            type="text"
            placeholder="Buscar..."
            className="min-w-[400px] bg-transparent pr-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
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

      <div className="cart mr-5">
        <Link
          href="/cart"
          className="group inline-block rounded-full border border-gray-200 p-2 transition hover:bg-orange-800 dark:border-slate-800"
        >
          <ShoppingCartIcon className="h-5 w-5 text-gray-800 transition group-hover:text-white dark:text-slate-100" />
        </Link>
      </div>

      <div className="account mr-3">
        <Link href="/client/mi-cuenta" className="relative bottom-[3px]">
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
