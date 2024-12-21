import { useContext, useEffect } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";
import ChatRoom from "@/Pages/ChatRoom/Partials/ChatRoom.jsx";

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

        setChatRooms(prev => prev.map(cr => cr.id === chatRoomId ? { ...cr, unread_count: unreadCount, last_read_at: lastReadAt } : cr));
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
        <div className={`mb-3`}>
            {chatRooms.map((chatRoom) => (
                <ChatRoom
                    key={chatRoom.id}
                    chatRoom={chatRoom}
                    onClickHandler={() => onChatRoomClick(chatRoom)}
                />
            ))}
        </div>
    )
}
