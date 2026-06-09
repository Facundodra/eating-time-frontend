"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { LoginWebResponse } from "@/lib/shared/auth/types";
import EatingTimeLogo from "@/ui/shared/images/logo.png";
import SessionWidget from "../shared/widgets/session-widget";
import NavLinksRestaurant from "./nav-links";

export default function Sidenav({ session }: { session: LoginWebResponse }) {
  const pathname = usePathname();

  return (
    <aside
      className={clsx(
        "sidenav restaurant-sidenav sticky top-0 hidden h-screen w-[80px] flex-col overflow-hidden border-r border-gray-200 bg-white px-2 py-5 transition-all duration-300 ease-in-out hover:w-[260px] lg:flex dark:border-slate-800 dark:bg-slate-950",
        {
          mini: pathname !== "/restaurant",
        },
      )}
    >
      <Link href="/restaurant" className="logo mb-4 flex h-[44px] shrink-0 items-center gap-2 px-[22px]">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
          <Image
            src={EatingTimeLogo}
            alt="Eating Time Logo"
            width={28}
            height={28}
            className="h-7 w-7 max-w-none rounded-lg"
          />
        </span>
        <div className="logo_content">
          <span className="logo_content_name whitespace-nowrap text-xl font-bold text-slate-950 dark:text-slate-50">
            Eating<span className="text-red-600 dark:text-red-500">Time</span>
          </span>
          <span className="logo_content_user-type block whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
            Panel del local
          </span>
        </div>
      </Link>

      <div className="clean-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
        <NavLinksRestaurant />
      </div>
      <SessionWidget session={session} profileHref="/restaurant/my-data" />
    </aside>
  );
}
