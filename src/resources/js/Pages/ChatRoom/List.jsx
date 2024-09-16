import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Head, Link, router} from '@inertiajs/react';
import PrimaryButton from "@/Components/PrimaryButton.jsx";

export default function List({auth, chatRooms}) {

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Chat Rooms</h2>}
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

                            <div>
                                {chatRooms.map((room) => (
                                    <div key={room.id} className="p-1">
                                        <Link href={route('chat_rooms.show', room.id)}>{room.title}</Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
