import LocalCalification from "../shared/widgets/calification";
import LocalStatus from "../shared/widgets/local_status";
import ProfilePicture from "../shared/widgets/profile_picture";
import UserName from "../shared/widgets/user_name";
import PageTitle from "../shared/widgets/page_title";

import Link from "next/link";

export default function Topnav() {
    return(
        <>
            <div className="local-top-nav flex items-center gap-2 py-3 mb-4">
                <PageTitle />
                <LocalStatus className="ml-auto"/>
                <LocalCalification/>
                <div className="user">
                    <Link href="/mis-datos" className="flex items-center gap-1 shadow-sm py-1 px-2 rounded-3xl w-fit">
                        <ProfilePicture className="w-[30px] h-[auto]"/>
                        <UserName className="text-sm"/>
                    </Link>                    
                </div>                
            </div>           
    
        </>
    );
}
