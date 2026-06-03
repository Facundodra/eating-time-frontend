"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { logout } from "@/services/shared/auth-service";
import PageLoader from "@/ui/shared/feedback/page-loader";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function closeSession() {
      try {
        await logout();
      } finally {
        router.replace("/login");
        router.refresh();
      }
    }

    void closeSession();
  }, [router]);

  return <PageLoader />;
}
