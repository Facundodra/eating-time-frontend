"use client";

import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import ProfilePicture from "./profile-picture";
import UserEmail from "./user-email";
import UserName from "./user-name";

type SessionWidgetProps = {
  profileHref?: string;
};

export default function SessionWidget({
  profileHref = "/restaurant/my-data",
}: SessionWidgetProps) {
  return (
    <div className="session-widget mt-auto flex flex-col items-center">
      <Link
        href={profileHref}
        className="session-widget-link flex w-full items-center gap-3 overflow-hidden"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center">
          <ProfilePicture className="h-7 w-7 max-w-none" />
        </span>
        <div className="session-widget-content flex min-w-0 flex-col justify-center">
          <UserName className="session-widget-name mb-1 block text-sm font-medium leading-[1em]" />
          <UserEmail className="session-widget-email block text-xs leading-[1em] text-gray-500" />
        </div>
      </Link>
      <Link
        href="/logout"
        className="logout-button btn-primary mt-4 flex w-full items-center gap-2 overflow-hidden text-center"
      >
        <ArrowLeftEndOnRectangleIcon className="h-5 w-5 shrink-0" />
        <span className="logout-button-label block max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 ease-in-out">
          Cerrar sesion
        </span>
      </Link>
    </div>
  );
}
