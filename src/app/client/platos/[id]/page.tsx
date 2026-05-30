import { getDish } from "@/services/client/client-service";
import DishesDetailPage from "@/ui/client/dishes/dishes-detail-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dish = await getDish(id);
  return <DishesDetailPage dish={dish} />;
}
