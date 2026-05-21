import Link from "next/link";

import ProfilePicture from "../shared/widgets/profile_picture";
import UserName from "../shared/widgets/user_name";

export default function Topnav() {
  return (
    <div className="admin-top-nav mb-4 flex items-center justify-end gap-2 py-1">
        <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Bienvenido/a al sistema
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          Panel de administracion
        </h1>
      </div>
      <div className="user">
        <Link
          href="/admin/mis-datos"
          className="flex w-fit items-center gap-2 rounded-3xl bg-white px-3 py-2 shadow-sm ring-1 ring-gray-100 dark:bg-slate-900 dark:ring-slate-800"
        >
          <ProfilePicture className="h-8 w-8" />
          <UserName className="text-sm font-semibold" />
        </Link>
      </div>
    </div>
  );
}
