import Header from "@/ui/client/header";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="p-10">{children}</main>
    </>
  );
}
