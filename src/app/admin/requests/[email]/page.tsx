import RequestDetailPage from "@/ui/admin/requests/request-detail-page";

type Props = {
  params: Promise<{
    email: string;
  }>;
};

export default async function RequestPage({ params }: Props) {
  const { email } = await params;

  return <RequestDetailPage email={decodeURIComponent(email)} />;
}