"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getSessionDisplayData } from "@/lib/shared/auth/session-display";
import type { LoginWebResponse } from "@/lib/shared/auth/types";
import { getPageMetadata } from "@/lib/shared/page-metadata";
import ThemeToggle from "../shared/theme/theme-toggle";
import ProfilePicture from "../shared/widgets/profile-picture";
import RestaurantRating from "../shared/widgets/rating";
import RestaurantStatus from "../shared/widgets/restaurant-status";
import UserName from "../shared/widgets/user-name";

export default function Topnav({ session }: { session: LoginWebResponse }) {
  const pathname = usePathname();
  const pageHeader = getPageMetadata(pathname);
  const { imageUrl, name, profileAlt } = getSessionDisplayData(session);

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
        <ThemeToggle />
        <RestaurantStatus />
        <RestaurantRating />
        <div className="user">
          <Link
            href="/restaurant/my-data"
            className="flex w-fit items-center gap-2 rounded-3xl bg-white px-3 py-2 shadow-sm ring-1 ring-gray-100 dark:bg-slate-900 dark:ring-slate-800"
          >
            <ProfilePicture
              alt={profileAlt}
              imageUrl={imageUrl}
              className="h-8 w-8"
            />
            <UserName name={name} className="text-sm font-semibold" />
          </Link>
        </div>
      </div>
    </div>
  );
}
