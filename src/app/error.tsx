"use client";

import ErrorPanel from "@/ui/shared/feedback/error-panel";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPanel onReset={reset} />;
}
