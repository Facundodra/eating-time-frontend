import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import SideNav from '@/ui/sidenav';
import Topnav from "@/ui/topnav";
import Header from "@/ui/header";
import "@/css/globals.css";

import clsx from "clsx";

import { Usuario } from "../lib/data";

export const metadata: Metadata = {
  title: "Eating Time",
  description: "All you can eat, all the time",
};

const inter = Inter({
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const tipoUsuario = Usuario.tipo_usuario;
  return (
    <html
      lang="en"      
    >
      <body className={clsx(`${inter.className} antialiased`, {"flex flex-wrap" : tipoUsuario === "admin" || tipoUsuario === "local"})}>
        {tipoUsuario === "admin" || tipoUsuario === "local" ? (
          <SideNav />
        ) : null}
        {tipoUsuario === "cliente" && (
          <Header />
        )}
        <main className={clsx("p-10", {"flex-1": tipoUsuario === "local" || tipoUsuario === "admin"})}>
          {tipoUsuario === "local" && (
            <Topnav />
          )}
          {children}
        </main>        
      </body>
    </html>
  );
}
