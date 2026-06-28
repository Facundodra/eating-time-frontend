import RestaurantDetailPage from "@/ui/client/restaurant/restaurant-detail-page";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ dishId?: string | string[] }>;
}) {
  const { id } = await params;
  const paramsData = await searchParams;
  const dishId = Array.isArray(paramsData.dishId)
    ? paramsData.dishId[0]
    : paramsData.dishId;

  return <RestaurantDetailPage id={id} initialDishId={dishId ?? null} />;
}
