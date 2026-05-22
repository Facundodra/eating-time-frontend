import { UserIcon } from "@heroicons/react/24/solid";
import { clsx } from "clsx";

export default function ProfilePicture({ className }: { className?: string }) {
  return (
    <span
      aria-label="Foto de perfil"
      className={clsx(
        "profile-picture flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white shadow-sm ring-2 ring-white dark:ring-slate-900",
        className,
      )}
    >
      <UserIcon className="h-[58%] w-[58%]" />
    </span>
  );
}
