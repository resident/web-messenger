import { useContext, useEffect, useState } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";
import ChatRoom from "@/Pages/ChatRoom/Partials/ChatRoom.jsx";

export default function ChatRooms({ onChatRoomClick = chatRoom => null }) {
    const {
        user,
        chatRooms, setChatRooms,
    } = useContext(ApplicationContext);

    const [chatRoomsLoaded, setChatRoomsLoaded] = useState(false);

    useEffect(() => {
        if (!sessionLocked) {
            setChatRoomsLoaded(false);

            axios.get(route('chat_rooms.list')).then((response) => {
                setChatRooms(response.data);
                setChatRoomsLoaded(true);

                const userIds = [];
                response.data.forEach(chatRoom => {
                    chatRoom.users.forEach(user => {
                        if (!userIds.includes(user.id)) {
                            userIds.push(user.id);
                        }
                    });
                });

                axios.post(route('users-status.get'), { user_ids: userIds }).then((statusResponse) => {
                    const statuses = statusResponse.data;
                    setChatRooms(prevChatRooms => prevChatRooms.map(chatRoom => {
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
                    }));
                });
            });
        }
    }, [sessionLocked]);

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
