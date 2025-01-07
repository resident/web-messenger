import { useEffect, useState, useContext } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";
import axios from "axios";

export default function ChatStatus({ backgroundMode = "blue", ...props }) {
    const {
        userPrivateKey,
        user,
        chatRooms, setChatRooms,
    } = useContext(ApplicationContext);
    const [chatRoom, setChatRoom] = useState(props.chatRoom);
    const [isOnline, setIsOnline] = useState(chatRoom.is_online);
    const [lastSeenAt, setLastSeenAt] = useState(chatRoom.last_seen_at);
    const [memberCount, setMemberCount] = useState(chatRoom.users.length);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [onlineCount, setOnlineCount] = useState(0);

    const [otherUser, setOtherUser] = useState((chatRoom.users.length === 2)
        ? chatRoom.users.find(u => u.id !== user.id)
        : null);

    useEffect(() => {
        const updatedChatRoom = chatRooms.find(cr => cr.id === chatRoom.id);
        if (updatedChatRoom) {
            setChatRoom(updatedChatRoom);
        }
    }, [chatRooms]);

    useEffect(() => {
        setMemberCount(chatRoom.users.length);
        if (chatRoom.users.length === 2) {
            setOtherUser(chatRoom.users.find(u => u.id !== user.id));
        } else {
            setOtherUser(null);
            setOnlineCount(chatRoom.users.filter(u => u.is_online).length);
        }
    }, [chatRoom.users]);

    useEffect(() => {
        if (otherUser) {
            setIsOnline(otherUser.is_online);
            setLastSeenAt(otherUser.last_seen_at);
        } else {
            setIsOnline(false);
            setLastSeenAt(null);
        }
    }, [otherUser]);

    const fetchUserStatuses = async () => {
        if (!chatRoom || !chatRoom.users) return;
        const userIds = chatRoom.users.map(u => u.id);

        try {
            const statusResponse = await axios.post(route('users-status.get'), { user_ids: userIds });
            const statuses = statusResponse.data;

            setChatRooms(prev =>
                prev.map(cr => cr.id === chatRoom.id
                    ? {
                        ...cr,
                        users: cr.users.map(user => {
                            const status = statuses[user.id];
                            return {
                                ...user,
                                is_online: status?.is_online ?? false,
                                last_seen_at: status?.last_seen_at ?? null,
                            };
                        }),
                    }
                    : cr));

            if (chatRoom.users.length === 2) {
                if (otherUser) {
                    const status = statuses[otherUser.id];
                    setIsOnline(status?.is_online ?? false);
                    setLastSeenAt(status?.last_seen_at ?? null);
                }
            } else if (chatRoom.users.length > 2) {
                setOnlineCount(Object.values(statuses).filter(status => status.is_online).length);
            }

            setMemberCount(chatRoom.users.length);
        } catch (error) {
            console.error("failed to fetch user statuses:", error);
        }
    }

    useEffect(() => {
        fetchUserStatuses();
    }, [userPrivateKey]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentDate(new Date());
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const renderStatus = () => {
        if (memberCount > 2) {
            return (
                <div>
                    <span className="text-sm">{memberCount} members</span>
                    &nbsp;
                    <span className="text-sm">{onlineCount} online</span>
                </div>
            );
        } else if (memberCount === 2) {
            if (isOnline) {
                return <span className={`${backgroundMode === "white" ? "text-blue-500" : ""}`}>Online</span>
            } else if (lastSeenAt) {
                const lastSeenDate = new Date(lastSeenAt + 'Z');
                const diffTime = currentDate - lastSeenDate;
                const diffSeconds = Math.floor(diffTime / 1000);
                const diffMinutes = Math.floor(diffTime / (1000 * 60));
                const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                let lastSeenText = '';

                const lastSeenDay = lastSeenDate.getDate();
                const currentDay = currentDate.getDate();
                const lastSeenMonth = lastSeenDate.getMonth();
                const currentMonth = currentDate.getMonth();
                const lastSeenYear = lastSeenDate.getFullYear();
                const currentYear = currentDate.getFullYear();

                if (diffSeconds <= 60) {
                    lastSeenText = `Last seen just now`;
                } else if (diffMinutes < 60) {
                    lastSeenText = `Last seen ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
                } else if (diffHours < 24 &&
                    lastSeenDay === currentDay &&
                    lastSeenMonth === currentMonth &&
                    lastSeenYear === currentYear) {
                    lastSeenText = `Last seen today at ${lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                } else if (diffDays === 1 ||
                    (lastSeenDay !== currentDay &&
                        diffHours < 24 &&
                        lastSeenMonth === currentMonth &&
                        lastSeenYear === currentYear)) {
                    lastSeenText = `Last seen yesterday at ${lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                } else {
                    lastSeenText = `Last seen on ${lastSeenDate.toLocaleDateString()}`;
                }

                return <span className="text-sm">{lastSeenText}</span>;
            } else {
                return <span className="text-sm">Last seen recently</span>;
            }
        } else {
            return null;
        }
    }

    return (
        <div>
            {renderStatus()}
        </div>
    );
}
