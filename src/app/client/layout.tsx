import Header from "@/ui/client/header";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="px-5 md:px-10 py-10  bg-gray-100 min-h-[100vh]">{children}</main>
    </>
  );
}
