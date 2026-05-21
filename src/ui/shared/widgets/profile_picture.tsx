// Agarro el tipo de usuario hardcodeado
import { clsx } from "clsx";
import { Usuario } from "../../../lib/data";

import Image from "next/image";

export default function ProfilePicture({ className }: { className?: string }) {
    const foto = Usuario.foto;
    return(
        <Image className={clsx("foto-perfil w-10 h-10 rounded-full", className)} src={foto} alt="Profile Picture" width={50} height={50} style={{ clipPath: "circle()" }} />
    );
}