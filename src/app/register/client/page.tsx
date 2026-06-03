import RegisterPage from "@/ui/client/register/register-page";
import { redirect } from "next/navigation";

import { getBackendRoleHomePath } from "@/lib/shared/auth/routes";
import { getServerSession } from "@/lib/shared/auth/server-session";

export default async function Page() {
    const session = await getServerSession();
    
    if (session) {
        // Redirigir a usuarios logueados
        redirect(getBackendRoleHomePath(session.tipoUsuario));
    }

    return <RegisterPage />;
}
