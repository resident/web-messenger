import {useContext, useEffect, useRef, useState} from "react";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";
import {default as CommonChatRoom} from "@/Common/ChatRoom.js";
import ChatRoomMessage from "@/Common/ChatRoomMessage.js";
import {TrashIcon} from "@heroicons/react/24/solid/index.js";
import {router} from "@inertiajs/react";

export default function ChatRoom({className = '', chatRoom, onClickHandler = chatRoom => null}) {
    const {
        userPrivateKey,
        user,
        safeViewIsOn,
    } = useContext(ApplicationContext);

    const [chatRoomKey, setChatRoomKey] = useState(null);
    const [message, setMessage] = useState(null);

    const [isOnline, setIsOnline] = useState(chatRoom.is_online);

    const chatRoomKeyRef = useRef(chatRoomKey);

    useEffect(() => {
        if (userPrivateKey) {
            (async () => {
                setChatRoomKey(await CommonChatRoom.decryptChatRoomKey(
                    userPrivateKey, chatRoom.users.find(u => u.id === user.id).pivot.chat_room_key
                ));
            })();
        } else {
            setChatRoomKey(null);
        }
    }, [userPrivateKey]);

    useEffect(() => {
        chatRoomKeyRef.current = chatRoomKey;

        if (chatRoomKey && chatRoom.messages.length) {
            const message = chatRoom.messages[chatRoom.messages.length - 1];

            if (message.message_iv) {
                ChatRoomMessage.decryptMessage(chatRoomKey, message).then((message) => {
                    setMessage(message);
                });
            } else {
                setMessage(message);
            }
        } else {
            setMessage(null);
        }
    });

    useEffect(() => {
        setIsOnline(chatRoom.is_online);
    }, [chatRoom.is_online]);

    /*
    const markMessagesAsDelivered = (messageIds) => {
        axios.post(route('chat_rooms.messages.mark_as_delivered', chatRoom.id), {
            message_ids: messageIds
        }).catch(error => {

        })
    }*/

    const onChatRoomMessageSent = (e) => {
        ChatRoomMessage.decryptMessage(chatRoomKeyRef.current, e.message).then((message) => {
            setMessage(message);
            /*if (message.user_id !== user.id) {
                markMessagesAsDelivered([message.id]);
            }*/
        });
    };

    const onUserOnlineStatusChanged = (e) => {
        const {user_id, is_online, last_seen_at} = e;
        const otherUser = chatRoom.users.find(u => u.id !== user.id);
        if (otherUser && otherUser.id === user_id) {
            setIsOnline(is_online);
        }
    }

    useEffect(() => {
        const channel = `chat-room.${chatRoom.id}`;

        Echo.private(channel)
            .listen('ChatRoomMessageSent', onChatRoomMessageSent)
            .listen('UserOnlineStatusChanged', onUserOnlineStatusChanged);

        return () => {
            Echo.leave(channel);
        };
    }, []);

    const truncate = (str, maxLength) => {
        if (str && str.length > maxLength) {
            return str.slice(0, maxLength - 3) + '...';
        }

        return str;
    }

    const prettyCreatedAt = (inputDateTime) => {
        const inputDate = new Date(inputDateTime);
        const currentDate = new Date();

        const formatDate = (date) => date.toLocaleDateString();
        const getWeekDay = (date) => date.toLocaleDateString('en-US', {weekday: 'short'});

        if (inputDate.toLocaleDateString() === currentDate.toLocaleDateString()) {
            return inputDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        }

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(currentDate.getDate() - 7);

        if (inputDate >= oneWeekAgo) {
            return getWeekDay(inputDate);
        }

        return formatDate(inputDate);
    }

    const removeChatRoom = async (e) => {
        e.stopPropagation();

        await axios.delete(route('chat_rooms.destroy', chatRoom.id));

        router.visit(route('main'));
    };

    return (
        <div
            className={`flex min-w-min p-2 hover:bg-gray-100 cursor-pointer group ${className}`}
            onClick={onClickHandler}
        >
            <div className={`min-w-12 min-h-12 max-w-12 max-h-12 mr-3 bg-lime-300 rounded-full relative`}>
                {chatRoom.users.length === 2 && (
                    <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                )}
            </div>

            <div className={`w-full`}>
                <div className={`flex justify-between`}>
                    <div className={`flex gap-1 text-nowrap`}>
                        <span className={`font-bold `}>
                            {chatRoom.users.length === 2
                                && truncate(chatRoom.users.find(u => u.id !== user.id).name, 15)
                                || truncate(chatRoom.title, 15)
                            }
                        </span>

                        {message && (<span className={`text-sm`}>{prettyCreatedAt(message.created_at)}</span>)}
                    </div>

                    <div className={`flex gap-0.5`}>
                        <TrashIcon
                            className={`
                            size-4 opacity-0 group-hover:opacity-100 cursor-pointer
                            ${self ? 'text-lime-500 hover:text-lime-700 ' : 'text-yellow-500 hover:text-yellow-700 '}
                        `}
                            onClick={removeChatRoom}
                        />
                    </div>
                </div>

                {message && (
                    <div
                        className={`text-gray-400 ${safeViewIsOn && 'blur-sm group-hover:blur-0'}`}
                    >
                        {truncate(message.message, 20)}
                    </div>
                )}

            </div>
        </div>
    );
}
