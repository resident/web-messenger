import {Link} from "@inertiajs/react";
import {useContext, useEffect, useState} from "react";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";

export default function ChatRooms() {
    const {
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

    return (
        <div>
            {chatRooms.map((room) => (
                <div key={room.id} className="p-1">
                    <Link href={route('chat_rooms.show', room.id)}>{room.title}</Link>
                </div>
            ))}
        </div>
    )
}
