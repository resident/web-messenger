import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import ChatRoomMessages from "@/Pages/ChatRoom/Partials/ChatRoomMessages.jsx";
import { useEffect, useState } from "react";

export default function Show({ auth, chatRoom }) {
    const [isOnline, setIsOnline] = useState(false);
    const [lastSeenAt, setLastSeenAt] = useState(null);
    const [memberCount, setMemberCount] = useState(chatRoom.users.length);
    const [chatRoomUsers, setChatRoomUsers] = useState(chatRoom.users);
    const [currentDate, setCurrentDate] = useState(new Date());

    const onUserOnlineStatusChanged = (e) => {
        const { user_id, is_online, last_seen_at } = e;
        const otherUser = chatRoom.users.find(u => u.id !== auth.user.id);
        if (otherUser && otherUser.id === user_id) {
            setIsOnline(is_online);
            setLastSeenAt(last_seen_at);
        }
    }

    useEffect(() => {
        let otherUser = null;

        if (chatRoomUsers.length === 2) {
            otherUser = chatRoom.users.find(u => u.id !== auth.user.id);
            if (otherUser) {
                setIsOnline(otherUser.is_online);
                setLastSeenAt(otherUser.last_seen_at);
            }
        }

        const channel = `chat-room.${chatRoom.id}`;
        const subscription = Echo.private(channel);

        if (chatRoomUsers.length === 2) {
            subscription.listen('UserOnlineStatusChanged', onUserOnlineStatusChanged);
        }

        // ChatRoomParticipantsChanged?

        return () => {
            Echo.leave(channel);
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentDate(new Date());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const renderStatus = () => {
        if (memberCount > 2) {
            // Static for now, can be changed higher
            return <span className="text-gray-500 text-sm">{memberCount} members</span>
        } else if (memberCount === 2) {
            if (isOnline) {
                return <span className="text-green-500">Online</span>
            } else if (lastSeenAt) {
                const lastSeenDate = new Date(lastSeenAt + 'Z');
                const diffTime = currentDate - lastSeenDate;
                const diffSeconds = Math.floor(diffTime / 1000);
                const diffMinutes = Math.floor(diffTime / (1000 * 60));
                const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                let lastSeenText = '';

                if (diffSeconds < 60) {
                    lastSeenText = `Last seen just now`;
                } else if (diffMinutes < 60) {
                    lastSeenText = `Last seen ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
                } else if (diffHours < 12) {
                    lastSeenText = `Last seen ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
                } else if (diffHours < 24) {
                    lastSeenText = `Last seen today at ${lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                } else if (diffDays === 1) {
                    lastSeenText = `Last seen yesterday at ${lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                } else {
                    lastSeenText = `Last seen on ${lastSeenDate.toLocaleDateString}`;
                }

                return <span className="text-gray-500 text-sm">{lastSeenText}</span>;
            } else {
                return <span className="text-gray-500 text-sm">Last seen recently</span>;
            }
        } else {
            return null;
        }
    }

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Chat Room</h2>}
        >
            <Head title="Chat Room" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div
                        className="bg-white overflow-hidden shadow-sm sm:rounded-lg outline outline-1 outline-lime-300">
                        <div className="p-6 0.text-gray-900">
                            <div className="w-full m-auto">
                                <div>
                                    <h2 className="font-bold mb-3 text-center">{chatRoom.title}</h2>
                                    {renderStatus()}
                                </div>


                                <ChatRoomMessages chatRoom={chatRoom} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
