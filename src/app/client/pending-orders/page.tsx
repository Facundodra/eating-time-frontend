import { Suspense } from "react";

import PageLoader from "@/ui/shared/feedback/page-loader";
import PendingOrdersPage from "@/ui/client/orders/pending-orders-page";

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PendingOrdersPage />
    </Suspense>
  );
}
