import SearchPage from "@/ui/client/search/search-page";

export default async function ClientSearchRoute({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;

  return <SearchPage initialQuery={rawQuery ?? ""} />;
}
