import {useContext, useEffect} from "react";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";
import ChatRoom from "@/Pages/ChatRoom/Partials/ChatRoom.jsx";

export default function ChatRooms({onChatRoomClick = chatRoom => null}) {
    const {
        user,
        chatRooms, setChatRooms,
    } = useContext(ApplicationContext);

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
