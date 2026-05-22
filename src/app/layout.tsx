import type { Metadata } from "next";
import "typeface-inter";
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
    <html lang="en">
      <body className="min-h-screen bg-gray-50 font-sans antialiased text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        {children}
      </body>
    </html>
  );
}
