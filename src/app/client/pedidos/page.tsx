import { Suspense } from "react";
import PaymentResultPage from "@/ui/client/checkout/payment-result-page";

export default function Page() {
  return (
    <Suspense>
      <PaymentResultPage />
    </Suspense>
  );
}
