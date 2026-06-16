import SearchPage from "@/ui/client/search/search-page";

type SearchTab = "all" | "restaurants" | "dishes" | "categories";

function getSearchTab(value?: string | string[]): SearchTab {
  const tab = Array.isArray(value) ? value[0] : value;

  return tab === "restaurants" || tab === "dishes" || tab === "categories"
    ? tab
    : "all";
}

export default async function ClientSearchRoute({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; tab?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;

  return <SearchPage initialQuery={rawQuery ?? ""} initialTab={getSearchTab(params.tab)} />;
}
