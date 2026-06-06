import { notFound } from "next/navigation";

import OrderHistoryDetailPage from "@/ui/client/orders/order-history-detail-page";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = Number(id);

  if (!Number.isFinite(orderId)) {
    notFound();
  }

  return <OrderHistoryDetailPage orderId={orderId} />;
}
