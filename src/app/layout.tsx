import type { Metadata } from "next";
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
      {children}
    </html>
  );
}
