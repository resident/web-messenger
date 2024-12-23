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
import UserCalls from "@/Components/UserCalls.jsx";
import {Cog8ToothIcon} from "@heroicons/react/24/solid/index.js";

export default function Authenticated({user, header, children}) {
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [chatRooms, setChatRooms] = useState([]);
    const [activeChatRoom, setActiveChatRoom] = useState(null);
    const [userPublicKey, setUserPublicKey] = useState(null);
    const [userPrivateKey, setUserPrivateKey] = useState(null);
    const [isInactive, setIsInactive] = useState(false);
    const [isInactiveNow, setIsInactiveNow] = useState(false);
    const [sessionLocked, setSessionLocked] = useState(false);
    const [userIsOnline, setUserIsOnline] = useState(false);
    const [safeViewIsOn, setSafeViewIsOn] = useState(user.settings.safe_view_is_on);
    const [outputCall, setOutputCall] = useState(null);

    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({x: 0, y: 0});
    const [contextMenuTarget, setContextMenuTarget] = useState(null);

    useEffect(() => {
        Echo.registerAxiosRequestInterceptor();
    }, []);

    return (
        <div className="sm:p-6 lg:p-8 min-h-dvh bg-gradient-to-b from-blue-500 to-blue-900">
            <ApplicationContextProvider value={{
                user,
                chatRooms, setChatRooms,
                activeChatRoom, setActiveChatRoom,
                userPublicKey, setUserPublicKey,
                userPrivateKey, setUserPrivateKey,
                isInactive, setIsInactive,
                isInactiveNow, setIsInactiveNow,
                sessionLocked, setSessionLocked,
                userIsOnline, setUserIsOnline,
                safeViewIsOn, setSafeViewIsOn,
                outputCall, setOutputCall,
                contextMenuVisible, setContextMenuVisible,
                contextMenuPosition, setContextMenuPosition,
                contextMenuTarget, setContextMenuTarget,
            }}>
                <SyncUserRsaKeys/>
                <LoadChatRooms/>
                <RotateUserRsaKeys/>
                <InactivityTracker/>
                <VisibilityTracker/>
                <UserStatusTracker/>
                <UserCalls/>

                <div className="max-w-7xl mx-auto text-gray-900">
                    <div
                        className={`
                            h-dvh sm:h-[calc(100dvh-4rem)]
                            overflow-auto
                            bg-blue-900 sm:p-2
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

                            <div></div>
                        </div>

                        <div
                            className={`
                                h-[calc(100dvh-4.1rem)] sm:h-[calc(100dvh-8.1rem)]
                                overflow-auto
                                grid grid-cols-1 md:grid-cols-[auto,1fr]
                            `}>

                            {/* Menu */}
                            <div className={`flex flex-col justify-between py-3 md:px-3 bg-blue-950`}>
                                <div>
                                    <div className={`${showingNavigationDropdown ? 'block' : 'hidden'}`}>
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

                                            <div className="space-y-1">
                                                <ResponsiveNavLink href={route('contact.show')}
                                                                   active={route().current('contscts.show')}
                                                >
                                                    Contacts
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

                                <div className={`text-white`}>
                                    <Cog8ToothIcon className={`size-5 cursor-pointer`}
                                                   onClick={() => {
                                                       setShowingNavigationDropdown((previousState) => !previousState)
                                                   }}
                                    />
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
