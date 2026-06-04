import { UserIcon } from "@heroicons/react/24/solid";
import { clsx } from "clsx";

export default function ProfilePicture({
  alt = "Foto de perfil",
  className,
  imageUrl,
}: {
  alt?: string;
  className?: string;
  imageUrl?: string | null;
}) {
  return (
    <span
      aria-label={alt}
      className={clsx(
        "profile-picture flex h-[35px] w-[35px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-600 text-white shadow-sm ring-2 ring-white dark:ring-slate-900",
        className,
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <UserIcon className="h-[58%] w-[58%]" />
      )}
    </span>
  );
}
