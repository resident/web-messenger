import { useContext, useEffect, useState } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";
import ChatRoom from "@/Pages/ChatRoom/Partials/ChatRoom.jsx";
import { PlusIcon } from "@heroicons/react/24/outline/index.js";
import { router } from "@inertiajs/react";

export default function ChatRooms({ onChatRoomClick = chatRoom => null, activeChatRoomM = null, onActiveChatRoomInvalidated }) {
    const {
        user,
        activeChatRoom,
        chatRooms, setChatRooms,
    } = useContext(ApplicationContext);

    const [chatRoomsH, setChatRoomsH] = useState(chatRooms);

    useEffect(() => {
        setChatRoomsH(chatRooms);

        if (activeChatRoom) {
            const isActiveChatRoomValid = chatRooms.some(cr => cr.id === activeChatRoom.id);
            if (!isActiveChatRoomValid) {
                onActiveChatRoomInvalidated();
            }
        }
    }, [chatRooms, activeChatRoom]);

    const onChatRoomCreated = async (e) => {
        const chatRoomId = e.chatRoomId;
        axios.get(route('chat_rooms.get_chat_room', { chatRoom: chatRoomId })).then(response => {
            const fetchedChatRoom = response.data;
            setChatRooms(rooms => [fetchedChatRoom, ...rooms]);
        });
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
    };

    const onUserOnlineStatusChanged = (e) => {
        const { user_id, is_online, last_seen_at } = e;
        console.log("ChatRooms changed:", { e });

        setChatRooms(prev =>
            prev.map(cr => {
                const updatedUsers = cr.users.map(u => {
                    if (u.id === user_id) {
                        return {
                            ...u,
                            is_online,
                            last_seen_at
                        };
                    }
                    return u;
                });
                return { ...cr, users: updatedUsers };
            })
        );
    };

    useEffect(() => {
        const channel = `chat-rooms.${user.id}`;

        Echo.private(channel)
            .listen('ChatRoomCreated', onChatRoomCreated)
            .listen('UserChatRoomUnreadCountUpdated', onUserChatRoomUnreadCountUpdated)
            .listen('ChatRoomAdded', onChatRoomCreated)
            .listen("UserOnlineStatusChanged", onUserOnlineStatusChanged);

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

            {chatRoomsH.map((chatRoom) => (
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
