"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import ThemeToggle from "../shared/theme/theme-toggle";
import ProfilePicture from "../shared/widgets/profile-picture";
import UserName from "../shared/widgets/user-name";

const pageHeaders = [
  {
    path: "/admin/requests",
    breadcrumb: "Administracion / Solicitudes",
    title: "Solicitudes de locales",
  },
  {
    path: "/admin",
    breadcrumb: "Administracion / Inicio",
    title: "Panel de administracion",
  },
];

function getPageHeader(pathname: string) {
  return (
    pageHeaders.find((header) => pathname.startsWith(header.path)) ??
    pageHeaders[1]
  );
}

export default function Topnav() {
  const pathname = usePathname();
  const pageHeader = getPageHeader(pathname);

  return (
    <div className="admin-top-nav mb-4 flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {pageHeader.breadcrumb}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          {pageHeader.title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="user">
          <Link
            href="/admin/my-data"
            className="flex min-h-11 w-fit items-center gap-2 rounded-3xl bg-white px-3 py-1.5 shadow-sm ring-1 ring-gray-100 dark:bg-slate-900 dark:ring-slate-800"
          >
            <ProfilePicture className="h-8 w-8" />
            <UserName className="leading-none text-sm font-semibold" />
          </Link>
        </div>
      </div>
    </div>
  );
}
