import { getSession } from "@/lib/auth/session";
import { getLocalDishes } from "@/services/local-dish-service";
import RestaurantDishesPage from "@/ui/restaurant/dishes/restaurant-dishes-page";

export default async function DishesPage() {
  const session = await getSession();
  const localId = session?.user.id ?? "";

  let initialData;
  try {
    initialData = await getLocalDishes(localId);
  } catch {
    initialData = { localId, dishes: [] };
  }

  return <RestaurantDishesPage initialData={initialData} />;
}
