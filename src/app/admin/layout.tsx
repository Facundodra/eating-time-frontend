import Sidenav from "@/ui/admin/sidenav";
import Topnav from "@/ui/admin/topnav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <Sidenav />

      <main className="flex-1 overflow-x-hidden px-6 py-6">
        <Topnav />

        <div className="mx-auto w-full max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}