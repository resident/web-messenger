import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import ChatRooms from "@/Pages/ChatRoom/Partials/ChatRooms.jsx";
import { useState } from "react";
import ChatRoomMessages from "@/Pages/ChatRoom/Partials/ChatRoomMessages.jsx";
import { ArrowLeftIcon } from "@heroicons/react/24/outline/index.js";
import ChatStatus from '@/Pages/ChatRoom/Partials/ChatStatus.jsx';
import ChatRoomMenu from "@/Pages/ChatRoom/Partials/ChatRoomMenu.jsx";
import ChatRoomTitle from '@/Pages/ChatRoom/Partials/ChatRoomTitle.jsx';

export default function Main({ auth, ...props }) {
    const [chatRoom, setChatRoom] = useState(props.chatRoom);


    return (
        <AuthenticatedLayout
            user={auth.user}
            header="Main"
        >
            <Head title="Main" />

            <div className={`grid grid-cols-1 md:grid-cols-[20rem,1fr]`}>
                <div
                    className={`
                        h-[calc(100dvh-4.1rem)] sm:h-[calc(100dvh-8.1rem)]
                        overflow-auto bg-blue-900 ${chatRoom ? 'hidden md:block' : ''}
                    `}>
                    <ChatRooms onChatRoomClick={chatRoom => {
                        setChatRoom(chatRoom);
                        router.get(route('main', chatRoom.id), {}, {
                            preserveState: true,
                            preserveScroll: true,
                            replace: true,
                            only: [],
                        });
                    }}
                        activeChatRoom={chatRoom}
                        onActiveChatRoomInvalidated={() => setChatRoom(null)}
                    />
                </div>

                <div className={`bg-blue-300`}>
                    {chatRoom &&
                        <div key={chatRoom.id}>
                            <div key={chatRoom.id} className={`p-2 flex justify-between bg-blue-500 text-white`}>
                                <div>
                                    <ArrowLeftIcon
                                        className={`size-8 rounded-full p-1 hover:bg-blue-600 cursor-pointer`}
                                        onClick={() => {
                                            setChatRoom(null)
                                            router.get(route('main'), {}, {
                                                preserveState: true,
                                                preserveScroll: true,
                                                replace: true,
                                                only: []
                                            });
                                        }}
                                    />
                                </div>

                                <div className={`flex gap-5`}>
                                    <ChatStatus chatRoom={chatRoom} />

                                    <ChatRoomTitle chatRoom={chatRoom} />

                                    <ChatRoomMenu chatRoom={chatRoom} />
                                </div>
                            </div>

                            <ChatRoomMessages chatRoom={chatRoom} />
                        </div> ||

                        <div className={`h-full p-6 hidden md:flex items-center justify-center`}>
                            <div className={`bg-black bg-opacity-20 text-white p-2 rounded-lg`}>
                                select chat room
                            </div>
                        </div>
                    }
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
