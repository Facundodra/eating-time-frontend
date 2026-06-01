import SideNav from "@/ui/restaurant/sidenav";
import Topnav from "@/ui/restaurant/topnav";

export default function RestaurantLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-wrap bg-gray-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <SideNav />

      <main className="min-w-0 flex-1 p-6 lg:p-10">
        <Topnav />
        {children}
      </main>
    </div>
  );
}
