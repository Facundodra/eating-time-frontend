import { clsx } from "clsx";
import Image from "next/image";

import { User } from "@/lib/data";

export default function ProfilePicture({ className }: { className?: string }) {
  const photo = User.photo;

  return (
    <Image
      className={clsx("profile-picture h-10 w-10 rounded-full", className)}
      src={photo}
      alt="Profile Picture"
      width={50}
      height={50}
      style={{ clipPath: "circle()" }}
    />
  );
}
