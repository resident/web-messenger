import ApplicationLogo from '@/Components/ApplicationLogo';
import {Link} from '@inertiajs/react';
import {useEffect} from "react";

export default function Guest({children}) {
    useEffect(() => {
        sessionStorage.clear();
        localStorage.clear();
    }, []);

    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-blue-500">
            <div className="w-full sm:max-w-md mt-6 px-6 py-4 bg-slate-700 shadow-md overflow-hidden sm:rounded-lg">
                <div className="flex gap-2 items-end justify-center mb-2">
                    <Link href="/">
                        <ApplicationLogo className="size-10 fill-current text-white"/>
                    </Link>

                    <div className="font-bold text-3xl text-white">
                        Messenger
                    </div>
                </div>

                {children}
            </div>
        </div>
    );
}

