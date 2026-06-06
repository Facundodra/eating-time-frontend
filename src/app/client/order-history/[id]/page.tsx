import ComingSoonPage from "@/ui/shared/feedback/coming-soon-page";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ComingSoonPage
      backHref="/client/order-history"
      backLabel="Volver al historial"
      title={`Detalle del pedido #${id}`}
      description="Próximamente vas a poder ver acá el detalle completo del pedido, los platos y el resto de la información."
    />
  );
}
