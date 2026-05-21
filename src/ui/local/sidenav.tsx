"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import EatingTimeLogo from "@/ui/shared/img/logo.png";
import NavLinksLocal from "./nav-links-local";
import SessionWidget from "../shared/widgets/session_widget";

import { Usuario } from "../../lib/data";

export default function Sidenav() {
    const tipoUsuario = Usuario.tipo_usuario;
    const pathname = usePathname();
    return(
        <div className={clsx("sidenav flex flex-col w-[80px] py-10 px-2 h-screen border-r border-gray-200 group/show hover:w-[15%] hover:px-10 transition-all duration-300 ease-in-out overflow-hidden", {
            "mini": pathname !== "/"
        })}>
            {/* Logo */}
            <Link href="/" className="logo flex items-center gap-4 mb-10">
                <img src={EatingTimeLogo.src} alt="Eating Time Logo" className="w-[50px]" />
                <div className="logo_content">
                    <span className="logo_content_name text-xl font-bold ">Eating Time</span>
                    <span className="logo_content_user-type block  text-sm text-gray-500 ">Panel administrador</span>
                </div>                
            </Link>
            {/* Renderizo los enlaces dependiendo del tipo de usuario */}
            {tipoUsuario === "local" && (
                <>
                    {/* MENUS LOCAL */}
                    <NavLinksLocal />
                </>
            )}
            {/* Widget de sesión */}
            <SessionWidget />
        </div>
    );
}
