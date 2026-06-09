import ForgotPasswordPage from "@/ui/shared/auth/forgot-password-page";

type PageProps = {
  searchParams: Promise<{
    email?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { email } = await searchParams;

  return <ForgotPasswordPage initialEmail={email ?? ""} />;
}
