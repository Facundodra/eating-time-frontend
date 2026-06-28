import LocalRatingPage from "@/ui/client/ratings/local-rating-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LocalRatingPage restaurant={{ id }} />;
}
