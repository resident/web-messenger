import {Link} from "@inertiajs/react";
import {useContext} from "react";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";

export default function ChatRooms() {
    const {chatRooms} = useContext(ApplicationContext);

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
