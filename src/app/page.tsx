import { redirect } from "next/navigation";

import { Usuario } from "@/lib/data";

export default function Home() {
  const tipoUsuario = Usuario.tipo_usuario;

  if (tipoUsuario === "admin") {
    redirect("/admin");
  }else if (tipoUsuario === "local") {
    redirect("/local");
  }else{
    redirect("/client");
  }
}
