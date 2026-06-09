"use client";

import { useEffect } from "react";

import { logout } from "@/services/shared/auth-service";
import PageLoader from "@/ui/shared/feedback/page-loader";

export default function LogoutPage() {
  useEffect(() => {
    async function closeSession() {
      try {
        await logout();
      } finally {
        window.location.replace("/login");
      }
    }

    void closeSession();
  }, []);

  return <PageLoader />;
}
