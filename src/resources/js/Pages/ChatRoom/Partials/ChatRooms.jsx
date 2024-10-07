import {useContext, useEffect, useState} from "react";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";
import ChatRoom from "@/Pages/ChatRoom/Partials/ChatRoom.jsx";

export default function ChatRooms() {
    const {
        user,
        chatRooms, setChatRooms,
        sessionLocked,
    } = useContext(ApplicationContext);

    const [chatRoomsLoaded, setChatRoomsLoaded] = useState(false);

    useEffect(() => {
        if (!sessionLocked) {
            setChatRoomsLoaded(false);

            axios.get(route('chat_rooms.list')).then((response) => {
                setChatRooms(response.data);
                setChatRoomsLoaded(true);
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
                <ChatRoom key={chatRoom.id} chatRoom={chatRoom}/>
            ))}
        </div>
    )
}
