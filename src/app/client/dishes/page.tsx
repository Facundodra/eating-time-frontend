import ClientDishesByRestaurantPage from "@/ui/client/dishes/dishes-by-restaurant-page";

type ClientDishesPageProps = {
  searchParams: Promise<{ categoryId?: string | string[]; q?: string | string[] }>;
};

function parseCategoryId(value?: string | string[]) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue);

  return rawValue && Number.isFinite(parsed) ? parsed : null;
}

export default async function ClientDishesPage({
  searchParams,
}: ClientDishesPageProps) {
  const params = await searchParams;
  const query = Array.isArray(params.q) ? params.q[0] : params.q;

  return (
    <ClientDishesByRestaurantPage
      initialCategoryId={parseCategoryId(params.categoryId)}
      initialQuery={query ?? ""}
    />
  );
}
