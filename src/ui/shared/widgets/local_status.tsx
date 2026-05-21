// Agarro el tipo de usuario hardcodeado
import { Local } from "@/lib/data";

import clsx from "clsx";

export default function LocalStatus({ className }: { className?: string }) {
    const estado = Local.estado;
    return(
        // Se muestra verde si esta abierto y rojo si esta cerrado
        <div className={clsx("estado-local flex items-center rounded-3xl px-4 py-3 inline-block leading-1", {"abierto bg-green-100": estado === 1, "cerrado bg-red-100": estado === 0}, className)}>
            <span className="text-sm font-bold text-xs leading-1 [.abierto_&]:text-green-600 [.cerrado_&]:text-red-500 before:content-[''] before:inline-block before:w-[6px] before:h-[6px] before:rounded-full before:relative before:bottom-[1px] [.cerrado_&]:before:bg-red-500 [.abierto_&]:before:bg-green-600 before:mr-1">
                {estado === 1 ? "Abierto" : "Cerrado"}
            </span>
        </div>
    );
}
