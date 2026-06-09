"use client";

import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { getSessionDisplayData } from "@/lib/shared/auth/session-display";
import type { LoginWebResponse } from "@/lib/shared/auth/types";
import { logout } from "@/services/shared/auth-service";
import LoadingButton from "@/ui/shared/buttons/loading-button";

import ProfilePicture from "./profile-picture";
import UserEmail from "./user-email";
import UserName from "./user-name";

type SessionWidgetProps = {
  profileHref?: string;
  session: LoginWebResponse;
  showProfilePicture?: boolean;
};

export default function SessionWidget({
  profileHref = "/restaurant/my-data",
  session,
  showProfilePicture = true,
}: SessionWidgetProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // La sesión ya fue validada por el layout server. Este widget solo la muestra,
  // evitando una segunda llamada a /api/auth/me en cada pagina interna.
  const { email, imageUrl, name, profileAlt } = getSessionDisplayData(session);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="session-widget mt-3 flex shrink-0 flex-col items-center border-t border-gray-100 pt-3 dark:border-slate-800">
      <Link
        href={profileHref}
        className="session-widget-link flex w-full items-center gap-3 overflow-hidden"
      >
        {showProfilePicture ? (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center">
            <ProfilePicture
              alt={profileAlt}
              imageUrl={imageUrl}
              className="h-7 w-7 max-w-none"
            />
          </span>
        ) : null}
        <div className="session-widget-content flex min-w-0 flex-col justify-center">
          <UserName
            name={name}
            className="session-widget-name mb-1 block text-sm font-medium leading-[1em]"
          />
          <UserEmail
            email={email}
            className="session-widget-email block text-xs leading-[1em] text-gray-500"
          />
        </div>
      </Link>
      <LoadingButton
        type="button"
        onClick={handleLogout}
        isLoading={isLoggingOut}
        loadingText="Cerrando sesión..."
        className="logout-button btn-primary mt-3 flex w-full items-center gap-2 overflow-hidden text-center"
      >
        <ArrowLeftEndOnRectangleIcon className="h-5 w-5 shrink-0" />
        <span className="logout-button-label block max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 ease-in-out">
          Cerrar sesión
        </span>
      </LoadingButton>
    </div>
  );
}
