import {useContext, useEffect, useRef, useState} from "react";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";
import {default as CommonChatRoom} from "@/Common/ChatRoom.js";
import ChatRoomMessage from "@/Common/ChatRoomMessage.js";

export default function ChatRoom({className, chatRoom, onClickHandler = chatRoom => null}) {
    const {
        userPrivateKey,
    } = useContext(ApplicationContext);

    const [chatRoomKey, setChatRoomKey] = useState(null);
    const [message, setMessage] = useState(null);

    const chatRoomKeyRef = useRef(chatRoomKey);

    useEffect(() => {
        if (userPrivateKey) {
            (async () => {
                setChatRoomKey(await CommonChatRoom.decryptChatRoomKey(userPrivateKey, chatRoom.pivot.chat_room_key));
            })();
        } else {
            setChatRoomKey(null);
        }
    }, [userPrivateKey]);

    useEffect(() => {
        chatRoomKeyRef.current = chatRoomKey;

        if (chatRoomKey && chatRoom.messages.length) {
            const message = chatRoom.messages[0];

            if (message.message_iv) {
                ChatRoomMessage.decryptMessage(chatRoomKey, chatRoom.messages[0]).then((message) => {
                    setMessage(message);
                });
            } else {
                setMessage(message);
            }
        }
    }, [chatRoomKey]);

    const onChatRoomMessageSent = (e) => {
        ChatRoomMessage.decryptMessage(chatRoomKeyRef.current, e.message).then((message) => {
            setMessage(message);
        });
    };

    useEffect(() => {
        const channel = `chat-room.${chatRoom.id}`;

        Echo.private(channel)
            .listen('ChatRoomMessageSent', onChatRoomMessageSent)

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

    return (
        <div
            className={`flex min-w-min p-2 hover:bg-gray-100 cursor-pointer ${className}`}
            onClick={onClickHandler}
        >
            <div className={`w-12 h-12 mr-3 bg-lime-300 rounded-full`}></div>

            <div>
                <div className={`flex gap-1 text-nowrap`}>
                    <span className={`font-bold `}>{truncate(chatRoom.title, 15)}</span>

                    {message && (<span className={`text-sm`}>{prettyCreatedAt(message.created_at)}</span>)}
                </div>

                {message && (
                    <div className={`text-gray-400`}>{truncate(message.message, 20)}</div>
                )}

            </div>
        </div>
    );
}
