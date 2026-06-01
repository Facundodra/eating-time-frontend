"use client";

import useAccountProfile from "@/hooks/use-account-profile";

export default function UserEmail({ className }: { className?: string }) {
  const { profile } = useAccountProfile();
  const email = profile?.email || "";

  return <span className={`user-email ${className ?? ""}`.trim()}>{email}</span>;
}
