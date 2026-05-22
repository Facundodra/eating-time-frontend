import SideNav from "@/ui/admin/sidenav";
import Topnav from "@/ui/admin/topnav";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-wrap">
      <SideNav />

      <main className="min-w-0 flex-1 p-6 lg:p-10">
        <Topnav />
        {children}
      </main>
    </div>
  );
}
