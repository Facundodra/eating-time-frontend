"use client";
import { usePathname } from "next/navigation";
import { pageMetadata } from "../../../lib/page_metadata";

export default function PageTitle() {
    const pathname = usePathname();
    const meta = pageMetadata[pathname];
    if (!meta) return null;
    return (
        <div className="page-title mr-auto">
            <h1 className="text-2xl font-semibold leading-tight">{meta.title}</h1>
            <p className="text-xs text-gray-500">{meta.description}</p>
        </div>
    );
}
