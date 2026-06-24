"use client";

import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { getSessionDisplayData } from "@/lib/shared/auth/session-display";
import type { LoginWebResponse } from "@/lib/shared/auth/types";
import { getPageMetadata } from "@/lib/shared/page-metadata";
import EatingTimeLogo from "@/ui/shared/images/logo.png";
import ThemeToggle from "../shared/theme/theme-toggle";
import ProfilePicture from "../shared/widgets/profile-picture";
import SessionWidget from "../shared/widgets/session-widget";
import UserName from "../shared/widgets/user-name";
import { adminNavGroups } from "./nav-links-admin";

export default function Topnav({ session }: { session: LoginWebResponse }) {
  const pathname = usePathname();
  const pageHeader = getPageMetadata(pathname);
  const { imageUrl, name, profileAlt } = getSessionDisplayData(session);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <div className="admin-top-nav mb-5 flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="order-1 flex w-full items-center justify-between gap-3 sm:order-2 sm:w-auto sm:min-w-0 sm:justify-end">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menu"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm ring-1 ring-gray-100 transition hover:bg-slate-50 lg:hidden dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800 dark:hover:bg-slate-800"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Link
              href="/admin/my-data"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-slate-900 dark:ring-slate-800 sm:h-auto sm:w-fit sm:gap-2 sm:px-3 sm:py-2"
            >
              <ProfilePicture
                alt={profileAlt}
                imageUrl={imageUrl}
                className="h-8 w-8"
              />
              <UserName name={name} className="hidden text-sm font-semibold sm:block" />
            </Link>
          </div>
        </div>

        <div className="order-2 min-w-0 sm:order-1 sm:flex-1">
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
            {pageHeader.breadcrumb}
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl dark:text-white">
            {pageHeader.title}
          </h1>
        </div>
      </div>

      <div
        aria-hidden={!isMobileMenuOpen}
        className={clsx(
          "fixed inset-0 z-[70] lg:hidden",
          isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={clsx(
            "absolute inset-0 bg-slate-950/40 transition-opacity duration-300 ease-out",
            isMobileMenuOpen ? "opacity-100" : "opacity-0",
          )}
        >
          <button
            type="button"
            aria-label="Cerrar menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="h-full w-full cursor-default"
          />
        </div>

        <aside
          className={clsx(
            "relative flex h-full w-[min(86vw,320px)] flex-col overflow-y-auto border-r border-gray-200 bg-white p-5 shadow-2xl transition-transform duration-300 ease-out dark:border-slate-800 dark:bg-slate-950",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Image
                src={EatingTimeLogo}
                alt="Eating Time Logo"
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 rounded-lg"
                priority
              />
              <div className="min-w-0">
                <p className="truncate text-lg font-black text-slate-950 dark:text-white">
                  Eating<span className="text-red-600 dark:text-red-500">Time</span>
                </p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Panel administrador
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Cerrar menu"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          <nav className="space-y-5">
            {adminNavGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 text-xs font-black uppercase text-slate-400 dark:text-slate-500">
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {group.links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;

                    return (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={clsx(
                            "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-extrabold transition",
                            isActive
                              ? "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400"
                              : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          {link.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-auto pt-5">
            <SessionWidget
              expanded
              session={session}
              profileHref="/admin/my-data"
              showProfilePicture={false}
            />
          </div>
        </aside>
      </div>
    </>
  );
}
