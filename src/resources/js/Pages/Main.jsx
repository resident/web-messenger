import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Head, router} from '@inertiajs/react';
import ChatRooms from "@/Pages/ChatRoom/Partials/ChatRooms.jsx";
import {useState} from "react";
import ChatRoomMessages from "@/Pages/ChatRoom/Partials/ChatRoomMessages.jsx";
import { ArrowLeftIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline/index.js";
import ChatStatus from '@/Pages/ChatRoom/Partials/ChatStatus.jsx';

export default function Main({auth, ...props}) {
    const [chatRoom, setChatRoom] = useState(props.chatRoom);


    return (
        <AuthenticatedLayout
            user={auth.user}
            header="Main"
        >
            <Head title="Main"/>

            <div className={`grid grid-cols-1 md:grid-cols-[15rem,1fr]`}>
                <div
                    className={`
                        h-[calc(100dvh-4.1rem)] sm:h-[calc(100dvh-8.1rem)]
                        overflow-auto bg-gray-200 ${chatRoom ? 'hidden md:block' : ''}
                    `}>
                    <ChatRooms onChatRoomClick={chatRoom => {
                        setChatRoom(chatRoom);
                        router.visit(route('main', chatRoom.id));
                    }}/>
                </div>

                <div className={`bg-gradient-to-r from-green-400 to-blue-500`}>
                    {chatRoom &&
                        <div>
                            <div className={`p-2 flex justify-between bg-gray-200`}>
                                <div className={`rounded-full p-1 hover:bg-indigo-600 hover:text-white`}>
                                    <ArrowLeftIcon
                                        className={`size-6 cursor-pointer`}
                                        onClick={() => setChatRoom(null)}/>
                                </div>

                                <div>{chatRoom.title}</div>
                                <ChatStatus currentUserId={auth.user.id} chatRoom={chatRoom} />

                                <div className={`rounded-full p-1 hover:bg-indigo-600 hover:text-white`}>
                                    <EllipsisVerticalIcon
                                        className={`size-6 cursor-pointer`}/>
                                </div>
                            </div>

                            <ChatRoomMessages chatRoom={chatRoom}/>
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
