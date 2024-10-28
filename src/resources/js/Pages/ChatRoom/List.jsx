import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Head, router} from '@inertiajs/react';
import PrimaryButton from "@/Components/PrimaryButton.jsx";
import ChatRooms from "@/Pages/ChatRoom/Partials/ChatRooms.jsx";

export default function List({auth}) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header="Chat Rooms"
        >
            <Head title="Chat Rooms"/>

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">

                            <div className="mb-3">
                                <PrimaryButton
                                    onClick={() => router.visit(route('chat_rooms.create'))}
                                >+</PrimaryButton>
                            </div>

                            <ChatRooms onChatRoomClick={chatRoom => {
                                router.visit(route('chat_rooms.show', chatRoom.id));
                            }}/>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
