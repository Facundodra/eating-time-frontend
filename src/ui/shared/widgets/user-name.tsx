"use client";

import useAccountProfile from "@/hooks/use-account-profile";

export default function UserName({ className }: { className?: string }) {
  const { profile } = useAccountProfile();
  const name = profile?.nombre || "Usuario";

  return <span className={`user-name ${className ?? ""}`.trim()}>{name}</span>;
}
