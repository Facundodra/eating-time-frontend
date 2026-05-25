import { getLocalDiscounts } from "@/services/local-discount-service";
import RestaurantDiscountsPage from "@/ui/restaurant/discounts/restaurant-discounts-page";

export default async function DiscountsPage() {
  const discounts = await getLocalDiscounts("dev-local");

  return <RestaurantDiscountsPage initialData={discounts} />;
}
