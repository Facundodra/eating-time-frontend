import { getRestaurantDiscounts } from "@/services/restaurant/discount-service";
import RestaurantDiscountsPage from "@/ui/restaurant/discounts/discounts-page";

export default async function DiscountsPage() {
  const discounts = await getRestaurantDiscounts("dev-restaurant");

  return <RestaurantDiscountsPage initialData={discounts} />;
}
