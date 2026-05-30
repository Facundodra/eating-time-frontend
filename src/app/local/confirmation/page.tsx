import type { Metadata } from "next";

import LocalConfirmationPage from "@/ui/restaurant/activation/local-confirmation-page";

export const metadata: Metadata = {
  title: "Confirmación de local | Eating Time",
  description: "Confirmación de cuenta para locales aprobados.",
};

type PageProps = {
  searchParams?: Promise<{
    code?: string;
    email?: string;
    codigo?: string;
    correo?: string;
    token?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <LocalConfirmationPage
      initialEmail={params?.email ?? params?.correo ?? ""}
      initialCode={params?.codigo ?? params?.code ?? params?.token ?? ""}
    />
  );
}
