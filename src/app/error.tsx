"use client";

import { useEffect } from "react";

import ErrorPanel from "@/ui/shared/feedback/error-panel";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return <ErrorPanel onReset={reset} />;
}
