import Header from "@/ui/client/header";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="min-h-[100vh] bg-gray-100 px-5 py-10 text-slate-950 dark:bg-slate-950 dark:text-white md:px-10">
        {children}
      </main>
    </>
  );
}
