import RestaurantClaimDetailPage from "@/ui/restaurant/claims/claim-detail-page";

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ claimId: string }>;
}) {
  const { claimId } = await params;

  return <RestaurantClaimDetailPage claimId={claimId} />;
}
