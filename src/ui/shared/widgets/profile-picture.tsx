"use client";

import { UserIcon } from "@heroicons/react/24/solid";
import { clsx } from "clsx";
import { useEffect, useMemo, useState } from "react";

import {
  cacheBustImageUrl,
  getFirstImageUrl,
  PROFILE_PHOTO_UPDATED_EVENT,
} from "@/lib/shared/image-cache";

export default function ProfilePicture({
  alt = "Foto de perfil",
  className,
  imageUrl,
}: {
  alt?: string;
  className?: string;
  imageUrl?: unknown;
}) {
  const [cacheVersion, setCacheVersion] = useState(0);
  const normalizedImageUrl = useMemo(
    () => getFirstImageUrl(imageUrl),
    [imageUrl],
  );
  const displayImageUrl = useMemo(
    () =>
      cacheVersion > 0
        ? cacheBustImageUrl(normalizedImageUrl, cacheVersion)
        : normalizedImageUrl,
    [cacheVersion, normalizedImageUrl],
  );

  useEffect(() => {
    function handleProfilePhotoUpdated(event: Event) {
      const detail = (event as CustomEvent<{ version?: number }>).detail;
      setCacheVersion(detail?.version ?? Date.now());
    }

    window.addEventListener(
      PROFILE_PHOTO_UPDATED_EVENT,
      handleProfilePhotoUpdated,
    );

    return () => {
      window.removeEventListener(
        PROFILE_PHOTO_UPDATED_EVENT,
        handleProfilePhotoUpdated,
      );
    };
  }, []);

  return (
    <span
      aria-label={alt}
      className={clsx(
        "profile-picture flex h-[35px] w-[35px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-600 text-white shadow-sm ring-2 ring-white dark:ring-slate-900",
        className,
      )}
    >
      {displayImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={displayImageUrl} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <UserIcon className="h-[58%] w-[58%]" />
      )}
    </span>
  );
}
