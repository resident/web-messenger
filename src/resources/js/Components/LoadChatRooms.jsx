import { useContext, useEffect, useState } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";

export default function LoadChatRooms({ }) {
    const {
        chatRooms, setChatRooms,
        sessionLocked,
        user
    } = useContext(ApplicationContext);

    const [chatRoomsLoaded, setChatRoomsLoaded] = useState(false);

    const fetchChatRooms = async () => {
        const response = await axios.get(route('chat_rooms.list'));
        setChatRooms(response.data);
        setChatRoomsLoaded(true);
    };

    const fetchUserStatuses = async () => {
        const currentUserId = user.id;
        const twoUserChatRooms = chatRooms.filter(chatRoom => chatRoom.users.length === 2);
        const userIds = [...new Set(
            twoUserChatRooms.flatMap(chatRoom =>
                chatRoom.users
                    .filter(u => u.id !== currentUserId)
                    .map(u => u.id)
            )
        )];

        const statusResponse = await axios.post(route('users-status.get'), { user_ids: userIds });
        const statuses = statusResponse.data;

        const updatedChatRooms = chatRooms.map(chatRoom => {
            if (chatRoom.users.length === 2) {
                const otherUser = chatRoom.users.find(u => u.id !== currentUserId);
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
}
