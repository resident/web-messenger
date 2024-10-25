import { useContext, useEffect } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";
import ChatRoom from "@/Pages/ChatRoom/Partials/ChatRoom.jsx";

export default function ChatRooms({ onChatRoomClick = chatRoom => null }) {
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
        }
        else {
            setChatRooms(rooms => [{
                ...chatRoom,
                is_online: false,
                last_seen_at: null,
            }, ...rooms]);
        }
    };

    useEffect(() => {
        const channel = `chat-rooms.${user.id}`;

        Echo.private(channel)
            .listen('ChatRoomCreated', onChatRoomCreated);

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
