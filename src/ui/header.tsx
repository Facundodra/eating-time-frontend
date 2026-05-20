'use client';

import EatingTimeLogo from "@/ui/img/logo.png";
import { usePathname } from "next/navigation";
import Form from 'next/form';
import ProfilePicture from "./widgets/profile_picture";

import Link from "next/link";

// Defino iconos
import { 
  MagnifyingGlassIcon,
  ShoppingCartIcon
} from "@heroicons/react/24/outline";


export default function Header(){
    return(
        <>
        <div className="header-cliente flex items-center justify-between px-10 py-5">
            {/* Logo */}
            <Link href="/" className="logo flex items-center gap-4">
                <img src={EatingTimeLogo.src} alt="Eating Time Logo" className="w-[50px]" />
                <div className="logo_content">
                    <span className="logo_content_name block text-xl font-bold">Eating Time</span>
                </div>                
            </Link>
            {/* Buscador */}
            <div className="buscador ml-auto">
                <Form action="/search" className="bg-gray-100 border border-gray-100 flex align-center py-[8px] px-[15px] rounded-full transition w-fit hover:bg-white ">
                    <input type="text" placeholder="Buscar..." className="text-sm focus:outline-none pr-2 min-w-xl" />
                    <button type="submit" className="bg-orange-700 cursor-pointer p-2 rounded-full transition hover:bg-orange-800"><MagnifyingGlassIcon className="w-4 h-4  text-white" /></button>
                </Form>
            </div>
            {/* Carrito */}
            <div className="carrito ml-auto mr-5">
                <Link href="/carrito" className="border border-gray-200 inline-block p-2 rounded-full transition hover:bg-orange-800 group">
                    <ShoppingCartIcon className="w-5 h-5 text-gray-800 group-hover:text-white transition" />
                </Link>
            </div>
            { /* Cuenta */}
            <div className="cuenta">
                <Link href="/cuenta" className="relative bottom-[3px]">
                    <ProfilePicture />
                </Link>
            </div>
        </div>
        </>
    );
}