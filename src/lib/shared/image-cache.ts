export const PROFILE_PHOTO_UPDATED_EVENT = "profile-photo-updated";

export type ImageUrlValue =
  | string
  | null
  | undefined
  | ImageUrlValue[]
  | Record<string, unknown>;

const IMAGE_URL_KEYS = [
  "url",
  "src",
  "href",
  "path",
  "uri",
  "image",
  "imageUrl",
  "foto",
  "fotoUrl",
  "urlFoto",
  "urlFotoPerfil",
  "fotoPerfil",
  "fotoPerfilUrl",
  "perfil",
  "portada",
  "portadaUrl",
  "cover",
  "coverUrl",
  "urlPortada",
  "urlFotoPortada",
  "urlPortadaMobile",
  "urlPortadaDesktop",
  "fotoPortada",
  "fotoPortadaUrl",
  "secureUrl",
  "secure_url",
  "publicUrl",
  "public_url",
] as const;

export function getFirstImageUrl(...values: unknown[]): string | null {
  const visited = new Set<object>();

  for (const value of values) {
    const imageUrl = getImageUrlFromValue(value, visited, true);
    if (imageUrl) return imageUrl;
  }

  return null;
}

function getImageUrlFromValue(
  value: unknown,
  visited: Set<object>,
  allowPlainString: boolean,
): string | null {
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue || isObjectPlaceholderString(trimmedValue)) return null;

    return allowPlainString || isLikelyImageUrl(trimmedValue)
      ? trimmedValue
      : null;
  }

  if (!value || typeof value !== "object") return null;
  if (visited.has(value)) return null;

  visited.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const imageUrl = getImageUrlFromValue(item, visited, true);
      if (imageUrl) return imageUrl;
    }

    return null;
  }

  const record = value as Record<string, unknown>;

  for (const key of IMAGE_URL_KEYS) {
    const imageUrl = getImageUrlFromValue(record[key], visited, true);
    if (imageUrl) return imageUrl;
  }

  for (const item of Object.values(record)) {
    const imageUrl = getImageUrlFromValue(item, visited, false);
    if (imageUrl) return imageUrl;
  }

  return null;
}

function isLikelyImageUrl(value: string) {
  return (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:image/")
  );
}

function isObjectPlaceholderString(value: string) {
  const normalizedValue = value.toLowerCase().replace(/\s/g, "");

  return (
    normalizedValue === "object[]" ||
    normalizedValue === "[objectobject]" ||
    normalizedValue === "[objectarray]"
  );
}

export function cacheBustImageUrl(
  imageUrl: unknown,
  version: number,
) {
  const normalizedImageUrl = getFirstImageUrl(imageUrl);
  if (!normalizedImageUrl) return null;

  const [urlWithoutHash, hash = ""] = normalizedImageUrl.split("#", 2);
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
