'use client';

import ProfilePicture from "./profile_picture";
import UserName from "./user_name";
import UserEmail from "./user_email";

import Link from "next/link";

import { 
    ArrowLeftEndOnRectangleIcon
} from "@heroicons/react/24/outline";

export default function SessionWidget() {
    return(
        <>
            <div className="session-widget mt-auto">
                <Link href="/mis-datos" className="session-widget-link flex items-center gap-2">
                    <ProfilePicture className="w-[35px] h-[auto]"></ProfilePicture>
                    <div className="session-widget relative top-[4px] ">                    
                        <UserName className="session-widget-name block text-sm font-medium leading-[1em] mb-1" />    
                        <UserEmail className="session-widget-email block text-xs text-gray-500 leading-[1em]" />
                    </div>
                </Link>
                <Link href="/logout" className="logout-button btn-primary block mt-4 text-center">
                    <ArrowLeftEndOnRectangleIcon className="w-5 h-5 mr-2" />
                    Cerrar sesión
                </Link>
            </div>
        </>
    );
};