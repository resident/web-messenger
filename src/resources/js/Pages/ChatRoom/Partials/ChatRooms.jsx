import { useContext, useEffect, useState } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";
import ChatRoom from "@/Pages/ChatRoom/Partials/ChatRoom.jsx";

export default function ChatRooms({ onChatRoomClick = chatRoom => null }) {
    const {
        user,
        chatRooms, setChatRooms,
    } = useContext(ApplicationContext);

    const [chatRoomsLoaded, setChatRoomsLoaded] = useState(false);

    const fetchChatRooms = async () => {
        const response = await axios.get(route('chat_rooms.list'));
        setChatRooms(response.data);
        setChatRoomsLoaded(true);
    };

    const fetchUserStatuses = async () => {
        const userIds = [];
        chatRooms.forEach(chatRoom => {
            chatRoom.users.forEach(user => {
                if (!userIds.includes(user.id)) {
                    userIds.push(user.id);
                }
            });
        });

        const statusResponse = await axios.post(route('users-status.get'), { user_ids: userIds });
        const statuses = statusResponse.data;

        const updatedChatRooms = chatRooms.map(chatRoom => {
            if (chatRoom.users.length === 2) {
                const otherUser = chatRoom.users.find(u => u.id !== user.id);
                const status = statuses[otherUser.id];

                return {
                    ...chatRoom,
                    is_online: status?.is_online ?? false,
                    last_seen_at: status?.last_seen_at,
                };
            } else {
                return {
                    ...chatRoom,
                    is_online: false,
                    last_seen_at: null,
                };
            }
        });

        setChatRooms(updatedChatRooms);
    };

    useEffect(() => {
        if (!sessionLocked) {
            setChatRoomsLoaded(false);
            fetchChatRooms();
        }
    }, [sessionLocked]);

    useEffect(() => {
        if (chatRoomsLoaded) {
            fetchUserStatuses();
        }
    }, [chatRoomsLoaded]);

    useEffect(() => {
        if (sessionLocked && chatRoomsLoaded) {
            setChatRooms([])
        }
    }, [sessionLocked, chatRoomsLoaded]);

    const onChatRoomCreated = (e) => {
        setChatRooms(rooms => [e.chatRoom, ...rooms]);
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
        <div>
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
