"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import ProfilePicture from "../shared/widgets/profile-picture";
import RestaurantRating from "../shared/widgets/rating";
import RestaurantStatus from "../shared/widgets/restaurant-status";
import UserName from "../shared/widgets/user-name";

const pageHeaders = [
  {
    path: "/restaurant",
    breadcrumb: "Bienvenido/a al sistema",
    title: "Panel del local",
  },
];

function getPageHeader(pathname: string) {
  return (
    pageHeaders.find((header) => pathname.startsWith(header.path)) ??
    pageHeaders[0]
  );
}

export default function Topnav() {
  const pathname = usePathname();
  const pageHeader = getPageHeader(pathname);

  return (
    <div className="restaurant-top-nav mb-5 flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {pageHeader.breadcrumb}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          {pageHeader.title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
      <RestaurantStatus />
      <RestaurantRating />
      <div className="user">
        <Link
          href="/restaurant/my-data"
          className="flex w-fit items-center gap-2 rounded-3xl bg-white px-3 py-2 shadow-sm ring-1 ring-gray-100 dark:bg-slate-900 dark:ring-slate-800"
        >
          <ProfilePicture className="h-8 w-8" />
          <UserName className="text-sm font-semibold" />
        </Link>
      </div>
      </div>
    </div>
  );
}
