import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Head} from '@inertiajs/react';
import ChatRoomMessages from "@/Pages/ChatRoom/Partials/ChatRoomMessages.jsx";

export default function Show({auth, chatRoom}) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Chat Room</h2>}
        >
            <Head title="Chat Room"/>

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div
                        className="bg-white overflow-hidden shadow-sm sm:rounded-lg outline outline-1 outline-lime-300">
                        <div className="p-6 0.text-gray-900">
                            <div className="w-full m-auto">
                                <h2 className="font-bold mb-3 text-center">{chatRoom.title}</h2>

                                <ChatRoomMessages chatRoom={chatRoom}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
