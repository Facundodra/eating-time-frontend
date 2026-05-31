import LocalCartPage from "@/ui/client/carts/local-cart-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LocalCartPage localId={Number(id)} />;
}
