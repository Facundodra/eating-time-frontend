import RestaurantDetailPage from "@/ui/client/restaurant/restaurant-detail-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RestaurantDetailPage id={id} />;
}
