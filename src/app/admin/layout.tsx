import type { Metadata } from "next";
import SideNav from '@/ui/admin/sidenav';
import Topnav from "@/ui/admin/topnav";
import "@/css/globals.css";

export const metadata: Metadata = {
  title: "Eating Time",
  description: "All you can eat, all the time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   
    <body className="flex min-h-screen flex-wrap bg-gray-50 font-sans antialiased text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      
      <SideNav />
      
      <main className="min-w-0 flex-1 p-6 lg:p-10">
        
        <Topnav />
        
        {children}
      </main>        
    </body>
   
  );
}
