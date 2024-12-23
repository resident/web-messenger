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
        setChatRooms(prev => {
            const existingChatRoomIds = new Set(prev.map(cr => cr.id));
            const updatedChatRooms = prev.map(cr => {
                const matchingRoom = response.data.find(r => r.id === cr.id);
                if (!cr.last_message && matchingRoom?.last_message) {
                    return { ...cr, last_message: matchingRoom.last_message };
                }
                return cr;
            });

            const newChatRooms = response.data.filter(cr => !existingChatRoomIds.has(cr.id));

            return [...updatedChatRooms, ...newChatRooms];
        });
        setChatRoomsLoaded(true);
    };

    const fetchUserStatuses = async () => {
        // Так, як наприклад працює в телеграмі (онлайн тільки для приватних чатів)
        const currentUserId = user.id;
        const twoUserChatRooms = chatRooms.filter(chatRoom => chatRoom.users.length === 2);
        const userIds = [...new Set(
            twoUserChatRooms.flatMap(chatRoom =>
                chatRoom.users
                    .filter(u => u.id !== currentUserId)
                    .map(u => u.id)
            )
        )];
        // У випадку - онлайн для останніх повідомлень
        /*const currentUserId = user.id;
        const userIds = [...new Set(
            chatRooms
                .map(cr => cr.last_message?.user_id)
        )];
        console.log(userIds);*/

        const statusResponse = await axios.post(route('users-status.get'), { user_ids: userIds });
        const statuses = statusResponse.data;

        const updatedChatRooms = chatRooms.map(cr => {
            //const status = statuses[cr.last_message]
            return {
                ...cr,
                users: cr.users.map(u => {
                    const status = statuses[u.id];
                    return {
                        ...u,
                        is_online: status?.is_online ?? false,
                        last_seen_at: status?.last_seen_at ?? null,
                    };
                }),
            }
        });
        setChatRooms(() => updatedChatRooms);
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
