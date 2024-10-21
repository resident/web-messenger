import {useContext, useEffect, useState} from "react";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";

export default function LoadChatRooms({}) {
    const {
        setChatRooms,
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
}
