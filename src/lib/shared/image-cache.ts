export const PROFILE_PHOTO_UPDATED_EVENT = "profile-photo-updated";

export function cacheBustImageUrl(
  imageUrl: string | null | undefined,
  version: number,
) {
  if (!imageUrl) return imageUrl ?? null;

  const [urlWithoutHash, hash = ""] = imageUrl.split("#", 2);
  const separator = urlWithoutHash.includes("?") ? "&" : "?";
  const nextUrl = `${urlWithoutHash}${separator}v=${version}`;

  return hash ? `${nextUrl}#${hash}` : nextUrl;
}

export function notifyProfilePhotoUpdated(version = Date.now()) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<{ version: number }>(PROFILE_PHOTO_UPDATED_EVENT, {
      detail: { version },
    }),
  );
}
