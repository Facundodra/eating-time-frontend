import RestaurantCartPage from "@/ui/client/carts/restaurant-cart-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RestaurantCartPage restaurantId={Number(id)} />;
}
