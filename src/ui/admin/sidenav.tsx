"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import EatingTimeLogo from "@/ui/shared/img/logo.png";
import NavLinksAdmin from "./nav-links-admin";
import SessionWidget from "../shared/widgets/session_widget";

export default function Sidenav() {
  const pathname = usePathname();

  return (
    <aside
      className={clsx(
        "sidenav sticky top-0 flex h-screen w-[80px] flex-col overflow-hidden border-r border-gray-200 bg-white px-2 py-8 transition-all duration-300 ease-in-out hover:w-[260px] hover:px-7 dark:border-slate-800 dark:bg-slate-950",
        {
          mini: pathname !== "/admin",
        },
      )}
    >
      <Link href="/admin" className="logo mb-10 flex items-center gap-4">
        <Image
          src={EatingTimeLogo}
          alt="Eating Time Logo"
          width={44}
          height={44}
          className="w-[44px] rounded-xl"
        />
        <div className="logo_content">
          <span className="logo_content_name whitespace-nowrap text-xl font-bold">
            Eating Time
          </span>
          <span className="logo_content_user-type block whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
            Panel administrador
          </span>
        </div>
      </Link>

      <NavLinksAdmin />
      <SessionWidget />
    </aside>
  );
}
