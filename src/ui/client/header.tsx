"use client";

import {
  MagnifyingGlassIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import EatingTimeLogo from "@/ui/shared/images/logo.png";
import ThemeToggle from "../shared/theme/theme-toggle";
import ProfilePicture from "../shared/widgets/profile-picture";

export default function Header() {
  const pathname = usePathname();

  // Si estamos en un restaurante, el ícono del carrito apunta a su carrito
  const restaurantMatch =
    pathname.match(/^\/client\/local\/(\d+)/) ??
    pathname.match(/^\/client\/restaurant\/(\d+)/);
  const cartHref = restaurantMatch
    ? `/client/restaurant/${restaurantMatch[1]}/cart`
    : "/client/cart";

  return (
    <div className="client-header flex items-center justify-between px-10 py-5">
      <Link href="/" className="logo flex items-center gap-4">
        <Image
          src={EatingTimeLogo}
          alt="Eating Time Logo"
          width={50}
          height={50}
          className="w-[50px]"
        />
        <div className="logo_content">
          <span className="logo_content_name block text-xl font-bold">
            Eating Time
          </span>
        </div>
      </Link>

      <div className="search ml-auto hidden md:block">
        <Form
          action="/search"
          className="flex w-fit items-center rounded-full border border-gray-100 bg-gray-100 px-[15px] py-[8px] transition hover:bg-white"
        >
          <input
            type="text"
            placeholder="Buscar..."
            className="min-w-[400px] pr-2 text-sm focus:outline-none"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-full bg-orange-700 p-2 transition hover:bg-orange-800"
          >
            <MagnifyingGlassIcon className="h-4 w-4 text-white" />
          </button>
        </Form>
      </div>

      <div className="theme ml-auto mr-3">
        <ThemeToggle />
      </div>

      <div className="cart mr-5">
        <Link
          href={cartHref}
          className="group inline-block rounded-full border border-gray-200 p-2 transition hover:bg-orange-800"
        >
          <ShoppingCartIcon className="h-5 w-5 text-gray-800 transition group-hover:text-white" />
        </Link>
      </div>

      <div className="account">
        <Link href="/client/mi-cuenta" className="relative bottom-[3px]">
          <ProfilePicture />
        </Link>
      </div>
    </div>
  );
}
