// Agarro el tipo de usuario hardcodeado
import { Usuario } from "../../../lib/data";

export default function UserName({ className }: { className?: string }) {
    const nombre = Usuario.nombre;
    return(
        <span className={`nombre-usuario ${className ?? ""}`.trim()}>{nombre}</span>
    );
}