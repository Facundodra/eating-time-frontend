import RequestDetailPage from "@/ui/admin/requests/request-detail-page";

type Props = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function RequestPage({ params }: Props) {
  const { id } = await params;
  const numericId = Number(decodeURIComponent(id));

  return <RequestDetailPage id={numericId} />;
}
