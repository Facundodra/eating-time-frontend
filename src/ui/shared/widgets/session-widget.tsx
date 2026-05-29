"use client";

import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  clearSessionCookies,
  clearStoredSession,
} from "@/lib/auth/session-store";
import { logout } from "@/services/auth-service";
import LoadingButton from "@/ui/shared/buttons/loading-button";

import ProfilePicture from "./profile-picture";
import UserEmail from "./user-email";
import UserName from "./user-name";

type SessionWidgetProps = {
  profileHref?: string;
  showProfilePicture?: boolean;
};

export default function SessionWidget({
  profileHref = "/restaurant/my-data",
  showProfilePicture = true,
}: SessionWidgetProps) {
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
    <div className="session-widget mt-auto flex flex-col items-center">
      <Link
        href={profileHref}
        className="session-widget-link flex w-full items-center gap-3 overflow-hidden"
      >
        {showProfilePicture ? (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center">
            <ProfilePicture className="h-7 w-7 max-w-none" />
          </span>
        ) : null}
        <div className="session-widget-content flex min-w-0 flex-col justify-center">
          <UserName className="session-widget-name mb-1 block text-sm font-medium leading-[1em]" />
          <UserEmail className="session-widget-email block text-xs leading-[1em] text-gray-500" />
        </div>
      </Link>
      <LoadingButton
        type="button"
        onClick={handleLogout}
        isLoading={isLoggingOut}
        loadingText="Cerrando sesion..."
        className="logout-button btn-primary mt-4 flex w-full items-center gap-2 overflow-hidden text-center"
      >
        <ArrowLeftEndOnRectangleIcon className="h-5 w-5 shrink-0" />
        <span className="logout-button-label block max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 ease-in-out">
          Cerrar sesion
        </span>
      </LoadingButton>
    </div>
  );
}
