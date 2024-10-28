import {useEffect, useState} from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import {Link} from '@inertiajs/react';
import RotateUserRsaKeys from "@/Components/RotateUserRsaKeys.jsx";
import {ApplicationContextProvider} from "@/Components/ApplicationContext.jsx";
import InactivityTracker from "@/Components/InactivityTracker.jsx";
import VisibilityTracker from "@/Components/VisibilityTracker.jsx";
import UserStatusTracker from "@/Components/UserStatusTracker.jsx";
import SyncUserRsaKeys from "@/Components/SyncUserRsaKeys.jsx";
import LoadChatRooms from "@/Components/LoadChatRooms.jsx";

export default function Authenticated({user, header, children}) {
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [chatRooms, setChatRooms] = useState([]);
    const [userPublicKey, setUserPublicKey] = useState(null);
    const [userPrivateKey, setUserPrivateKey] = useState(null);
    const [isInactive, setIsInactive] = useState(false);
    const [isInactiveNow, setIsInactiveNow] = useState(false);
    const [sessionLocked, setSessionLocked] = useState(false);
    const [safeViewIsOn, setSafeViewIsOn] = useState(user.settings.safe_view_is_on);

    useEffect(() => {
        Echo.registerAxiosRequestInterceptor();
    }, []);

    return (
        <div className="sm:p-6 lg:p-8 min-h-dvh bg-gradient-to-b from-gray-100 to-gray-300">
            <ApplicationContextProvider value={{
                user,
                chatRooms, setChatRooms,
                userPublicKey, setUserPublicKey,
                userPrivateKey, setUserPrivateKey,
                isInactive, setIsInactive,
                isInactiveNow, setIsInactiveNow,
                sessionLocked, setSessionLocked,
                safeViewIsOn, setSafeViewIsOn,
            }}>
                <SyncUserRsaKeys/>
                <LoadChatRooms/>
                <RotateUserRsaKeys/>
                <InactivityTracker/>
                <VisibilityTracker/>
                <UserStatusTracker/>

                <div className="max-w-7xl mx-auto text-gray-900">
                    <div
                        className={`
                            h-dvh sm:h-[calc(100dvh-4rem)]
                            overflow-auto
                            bg-cyan-800 sm:p-2
                            shadow-sm sm:rounded-lg
                        `}>

                        {/* Logo, Header, Menu Button */}
                        <div className={`flex gap-2 p-2 sm:p-0 justify-between mb-2`}>
                            <Link href="/">
                                <ApplicationLogo className={`block h-9 w-auto fill-current text-white`}/>
                            </Link>

                            {header &&
                                <header className={`flex justify-center text-white`}>
                                    <div className="py-2">
                                        <h2 className="font-semibold text-xl text-gray-100 leading-tight">
                                            {header}
                                        </h2>
                                    </div>
                                </header>}

                            <div className="flex items-center">
                                <button
                                    onClick={() => {
                                        setShowingNavigationDropdown((previousState) => !previousState)
                                    }}
                                    className={`
                                                    inline-flex items-center justify-center p-2 rounded-md
                                                    text-gray-400 bg-gray-100
                                                    hover:text-gray-500 hover:bg-gray-200
                                                    focus:outline-none focus:bg-gray-200 focus:text-gray-500
                                                    transition duration-150 ease-in-out
                                                `}
                                >
                                    <svg className="h-6 w-6" stroke="currentColor" fill="none"
                                         viewBox="0 0 24 24">
                                        <path
                                            className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                        <path
                                            className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div
                            className={`
                                h-[calc(100dvh-4.1rem)] sm:h-[calc(100dvh-8.1rem)]
                                overflow-auto
                                grid grid-cols-1 md:grid-cols-[auto,1fr]
                            `}>

                            {/* Menu */}
                            <div className={`
                                py-3 md:px-3 bg-cyan-800
                                ${showingNavigationDropdown ? 'block' : 'hidden'}
                            `}>
                                <div className={``}>
                                    <div className="p-4">
                                        <div
                                            className="font-medium text-base text-gray-100">{user.name}</div>
                                        <div
                                            className="font-medium text-sm text-gray-200">{user.email}</div>
                                    </div>

                                    <nav>
                                        <div className="space-y-1">
                                            <ResponsiveNavLink href={route('main')}
                                                               active={route().current('main')}
                                            >
                                                Main
                                            </ResponsiveNavLink>
                                        </div>

                                        <div className="space-y-1">
                                            <ResponsiveNavLink href={route('chat_rooms.create')}
                                                               active={route().current('chat_rooms.create')}
                                            >
                                                Create Chat
                                            </ResponsiveNavLink>
                                        </div>

                                        <div>


                                            <div className="">
                                                <ResponsiveNavLink
                                                    href={route('profile.edit')}
                                                    active={route().current('profile.edit')}
                                                >
                                                    Profile
                                                </ResponsiveNavLink>

                                                <ResponsiveNavLink method="post" href={route('logout')}
                                                                   as="button"
                                                >
                                                    Log Out
                                                </ResponsiveNavLink>
                                            </div>
                                        </div>
                                    </nav>
                                </div>
                            </div>

                            {/* Content */}
                            <main className={`
                                md:col-start-2
                            `}>


                                {children}
                            </main>
                        </div>
                    </div>
                </div>
            </ApplicationContextProvider>
        </div>
    );
}
