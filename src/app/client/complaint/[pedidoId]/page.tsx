import ComplaintPage from "@/ui/client/complaints/complaint-page";

export default async function Page({
  params,
}: {
  params: Promise<{ pedidoId: string }>;
}) {
  const { pedidoId } = await params;
  const parsedId = Number(pedidoId);

  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    return (
      <div className="mx-auto max-w-[760px] px-4 py-6">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
          El identificador del pedido no es valido.
        </p>
      </div>
    );
  }

  return <ComplaintPage pedidoId={parsedId} />;
}
