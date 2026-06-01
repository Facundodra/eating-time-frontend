import ResetPasswordPage from "@/ui/shared/auth/reset-password-page";

type Props = { searchParams: Promise<{ token?: string }> };

export default async function Page({ searchParams }: Props) {
  const { token = "" } = await searchParams;
  return <ResetPasswordPage token={token} />;
}
