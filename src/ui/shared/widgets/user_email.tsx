// Agarro el tipo de usuario hardcodeado
import { Usuario } from "../../../lib/data";

export default function UserEmail({ className }: { className?: string }) {
    const email = Usuario.email;
    return(
        <span className={`nombre-email ${className ?? ""}`.trim()}>{email}</span>
    );
}