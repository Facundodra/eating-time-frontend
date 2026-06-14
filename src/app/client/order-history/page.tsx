import OrderHistoryPage from "@/ui/client/orders/order-history-page";
import PageLoader from "@/ui/shared/feedback/page-loader";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <OrderHistoryPage />
    </Suspense>
  );
}
