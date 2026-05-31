import RegisterPage from "@/ui/shared/auth/register-page";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getBackendRoleHomePath } from "@/lib/shared/auth/routes";
import { FRONTEND_SESSION_ROLE_COOKIE_NAME } from "@/lib/shared/auth/session-cookies";
import type { BackendUserRole } from "@/lib/shared/auth/types";

export default async function Page() {
    const cookieStore = await cookies();
    const role = cookieStore.get(FRONTEND_SESSION_ROLE_COOKIE_NAME)?.value as
        | BackendUserRole
        | undefined;
    
    if (role) {
        // Redirigir a usuarios logueados
        redirect(getBackendRoleHomePath(role));
    }

    return <RegisterPage />;
}
