import Header from "@/ui/client/header";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-100 px-4 pb-6 pt-24 dark:bg-slate-950 sm:px-5 md:px-8 md:pb-8 md:pt-36 lg:px-10 lg:pt-28">
        {children}
      </main>
    </>
  );
}
