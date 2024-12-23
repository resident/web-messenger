import { useContext, useEffect } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";
import ChatRoom from "@/Pages/ChatRoom/Partials/ChatRoom.jsx";
import { PlusIcon } from "@heroicons/react/24/outline/index.js";
import { router } from "@inertiajs/react";

export default function ChatRooms({ onChatRoomClick = chatRoom => null, activeChatRoomM = null }) {
    const {
        user,
        chatRooms, setChatRooms,
    } = useContext(ApplicationContext);

    const onChatRoomCreated = async (e) => {
        const chatRoom = e.chatRoom;
        const currentUserId = user.id;

        if (chatRoom.users.length === 2) {
            const otherUser = chatRoom.users.find(u => u.id !== currentUserId);

            const statusResponse = await axios.get(route('user-status.get', { userId: otherUser.id }));
            const status = statusResponse.data;

            const updatedChatRoom = {
                ...chatRoom,
                is_online: status?.is_online ?? false,
                last_seen_at: status?.last_seen_at,
            };

            setChatRooms(rooms => [updatedChatRoom, ...rooms]);
        } else {
            setChatRooms(rooms => [{
                ...chatRoom,
                is_online: false,
                last_seen_at: null,
            }, ...rooms]);
        }
    };

    const onUserChatRoomUnreadCountUpdated = async (e) => {
        const chatRoomId = e.chatRoomId;
        const unreadCount = e.unreadCount;
        const lastReadAt = e.lastReadAt;

        setChatRooms(prev => prev.map(cr => cr.id === chatRoomId ? {
            ...cr,
            unread_count: unreadCount,
            last_read_at: lastReadAt
        } : cr));
    }

    useEffect(() => {
        const channel = `chat-rooms.${user.id}`;

        Echo.private(channel)
            .listen('ChatRoomCreated', onChatRoomCreated)
            .listen('UserChatRoomUnreadCountUpdated', onUserChatRoomUnreadCountUpdated);

        return () => {
            Echo.leave(channel);
        };
    }, []);

    return (
        <div className={`p-2 mb-3 flex flex-col gap-y-2`}>
            <div className={`
                    h-10 bg-blue-400 hover:bg-blue-300 hover:cursor-pointer rounded-md flex justify-center items-center
                `}
                onClick={() => router.visit(route('chat_rooms.create'))}>
                <PlusIcon className={`size-6 stroke-[2px] text-white`} />
            </div>

            {chatRooms.map((chatRoom) => (
                <div key={chatRoom.id}>
                    <ChatRoom
                        key={chatRoom.id}
                        chatRoom={chatRoom}
                        onClickHandler={() => onChatRoomClick(chatRoom)}
                    />
                </div>
            ))}
        </div>
    )
}
