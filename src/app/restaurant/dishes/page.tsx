import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/shared/auth/server-session";
import RestaurantDishesPage from "@/ui/restaurant/dishes/dishes-page";
import { getRestaurantDishes } from "@/services/restaurant/dish-service";

export default async function DishesPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login?reason=auth-required");
  }

  const restaurantId = String(session.idTipoUsuario);
  const initialData = await getRestaurantDishes(restaurantId).catch(() => ({
    restaurantId,
    dishes: [],
  }));

  return <RestaurantDishesPage initialData={initialData} />;
}
