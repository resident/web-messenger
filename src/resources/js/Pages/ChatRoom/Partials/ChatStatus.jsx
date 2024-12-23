import {useEffect, useState} from "react";

export default function ChatStatus({currentUserId, chatRoom}) {
    const [isOnline, setIsOnline] = useState(chatRoom.is_online);
    const [lastSeenAt, setLastSeenAt] = useState(chatRoom.last_seen_at);
    const [memberCount, setMemberCount] = useState(chatRoom.users.length);
    const [currentDate, setCurrentDate] = useState(new Date());


    const onUserOnlineStatusChanged = (e) => {
        const {user_id, is_online, last_seen_at} = e;
        const otherUser = chatRoom.users.find(u => u.id !== currentUserId);
        if (otherUser && otherUser.id === user_id) {
            setIsOnline(is_online);
            setLastSeenAt(last_seen_at);
        }
    }

    useEffect(() => {
        if (chatRoom) {
            setIsOnline(chatRoom.is_online);
            setLastSeenAt(chatRoom.last_seen_at);
        } else {
            setIsOnline(false);
            setLastSeenAt(null);
        }

        const channel = `chat-room.${chatRoom.id}`;
        const subscription = Echo.private(channel);

        if (memberCount === 2) {
            subscription.listen('UserOnlineStatusChanged', onUserOnlineStatusChanged);
        }

        // ChatRoomParticipantsChanged?

        return () => {
            subscription.stopListening('UserOnlineStatusChanged');
        };
    }, [chatRoom]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentDate(new Date());
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const renderStatus = () => {
        if (memberCount > 2) {
            // Static for now, can be changed higher
            return <span className="text-gray-500 text-sm">{memberCount} members</span>
        } else if (memberCount === 2) {
            if (isOnline) {
                return <span className="text-green-500">Online</span>
            } else if (lastSeenAt) {
                const lastSeenDate = new Date(lastSeenAt + 'Z');
                const diffTime = currentDate - lastSeenDate;
                const diffSeconds = Math.floor(diffTime / 1000);
                const diffMinutes = Math.floor(diffTime / (1000 * 60));
                const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                let lastSeenText = '';

                if (diffSeconds <= 60) {
                    lastSeenText = `Last seen just now`;
                } else if (diffMinutes < 60) {
                    lastSeenText = `Last seen ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
                } else if (diffHours < 12) {
                    lastSeenText = `Last seen ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
                } else if (diffHours < 24) {
                    lastSeenText = `Last seen today at ${lastSeenDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}`;
                } else if (diffDays === 1) {
                    lastSeenText = `Last seen yesterday at ${lastSeenDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}`;
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
