import {useContext, useEffect, useState} from 'react';
import {ApplicationContext} from '@/Components/ApplicationContext.jsx';

export default function ChatRoomTitle({chatRoom}) {
    const {chatRooms} = useContext(ApplicationContext);
    const [title, setTitle] = useState(chatRoom.title);

    useEffect(() => {
        const updatedChatRoom = chatRooms.find(cr => cr.id === chatRoom.id);
        if (updatedChatRoom) {
            setTitle(updatedChatRoom.title);
        }
    }, [chatRooms, chatRoom.id]);

    return <div className="text-3xl w-1/3 overflow-hidden text-nowrap text-ellipsis">{title}</div>;
}
