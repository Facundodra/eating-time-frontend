// Agarro el tipo de usuario hardcodeado
import { Local } from "../../lib/data";

import { 
  StarIcon
} from "@heroicons/react/24/solid";

export default function LocalCalification() {
    const calificacion = Local.calificacion;
    return(
        <div className="flex items-center calificacion-local px-4 py-3 rounded-3xl bg-yellow-100 w-fit">
            <StarIcon className="w-3 text-yellow-400"></StarIcon>
            <span className="ml-1 text-xs font-bold text-orange-600 leading-1">{calificacion}</span>
        </div>
    );
}