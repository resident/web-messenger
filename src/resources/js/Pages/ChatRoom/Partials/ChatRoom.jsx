import { useContext, useEffect, useRef, useState } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";
import { default as CommonChatRoom } from "@/Common/ChatRoom.js";
import ChatRoomMessage from "@/Common/ChatRoomMessage.js";
import { TrashIcon } from "@heroicons/react/24/solid/index.js";
import { router } from "@inertiajs/react";
import Utils from "@/Common/Utils.js";

export default function ChatRoom({ className = '', chatRoom, onClickHandler = chatRoom => null }) {
    const {
        userPrivateKey,
        user,
        safeViewIsOn,
        chatRooms, setChatRooms,
        activeChatRoom,
    } = useContext(ApplicationContext);

    const [chatRoomKey, setChatRoomKey] = useState(null);
    const [lastMessage, setLastMessage] = useState(chatRoom.last_message);
    const [isOnline, setIsOnline] = useState(chatRoom.is_online);
    const [notification, setNotification] = useState(null);
    const [channel, setChannel] = useState(`chat-room.${chatRoom.id}`);

    const activeChatRoomRef = useRef(activeChatRoom);
    const chatRoomRef = useRef(chatRoom);

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
        //console.log("ChatRoom.last_message 0");
        if (!chatRoom.last_message) return;
        //console.log("ChatRoom.last_message 1");

        if (chatRoom.last_message.message_iv) {
            //console.log("ChatRoom.last_message 2");
            (async () => {
                ChatRoomMessage.decryptMessage(chatRoomKey, chatRoom.last_message).then((dMessage) => {
                    setChatRooms(prev =>
                        prev.map(cr =>
                            cr.id === chatRoom.id ? { ...cr, last_message: dMessage } : cr
                        )
                    );
                });
            })();
        } else {
            //console.log("ChatRoom.last_message 3");
            setLastMessage(chatRoom.last_message);
        }

    }, [chatRoom.last_message, chatRoomKey]);

    useEffect(() => {
        // Це був активний чат
        if (activeChatRoomRef.current?.id === chatRoom?.id) {
            // Якщо та, що оновилась, вже не наша -- оновимо прослуховування
            if (!activeChatRoom || activeChatRoom.id !== activeChatRoomRef.current.id) {
                Echo.private(channel)
                    .stopListening('ChatRoomMessageSent')
                    .stopListening('ChatRoomMessageRemoved')
                    .stopListening('UserOnlineStatusChanged')
                    .listen('ChatRoomMessageSent', onChatRoomMessageSent)
                    .listen('ChatRoomMessageRemoved', onChatRoomMessageRemoved)
                    .listen('UserOnlineStatusChanged', onUserOnlineStatusChanged);
            }
        }
        activeChatRoomRef.current = activeChatRoom;
    }, [activeChatRoom]);

    useEffect(() => {
        chatRoomRef.current = chatRoom;
    }, [chatRoom]);

    useEffect(() => {
        setIsOnline(chatRoom.is_online);
    }, [chatRoom.is_online]);

    const decryptAndSetLastMessage = (chatRoomKey, message) => {
        ChatRoomMessage.decryptMessage(chatRoomKey, message).then((dMessage) => {
            setChatRooms(prev =>
                prev.map(cr => {
                    if (cr.id === chatRoom.id) {
                        const updatedMessages = cr.messages.map(msg =>
                            msg.id === dMessage.id ? dMessage : msg
                        );
                        return { ...cr, messages: updatedMessages, last_message: dMessage }
                    }
                    return cr;
                })
            );
        });
    };

    useEffect(() => {
        if (!chatRoom) return;
        //console.log("Messages log:", chatRoom.messages);
        const mLength = chatRoom.messages.length;
        if (mLength > 0 && chatRoom.messages[mLength - 1].message_iv && chatRoomKey) {
            //console.log("Decrypting last message");
            decryptAndSetLastMessage(chatRoomKey, chatRoom.messages[mLength - 1]);
        }
    }, [chatRoom.messages]);

    useEffect(() => {
        //console.log("Render-1");
        if (!chatRoomKey) return;

        chatRoomKeyRef.current = chatRoomKey;

        //console.log("Render-2");
        if (chatRoom.messages.length) {
            //console.log("Render-3");
            //const message = chatRoom.messages[chatRoom.messages.length - 1];
            const isActiveRoom = activeChatRoom && activeChatRoom.id === chatRoom.id;
            // Більше ніж 1 непрочитаних повідомлень -- вважаємо потім у ChatRoomMessages як initialLoading, тобто щоб всі повідомлення грузило там.
            // Оскільки це викликається тільки один раз при відображенні чату, то логіка використовується тільки для початкового завантаження
            // Саме 1 повідомлення через те, що з нього треба буде починати показувати сам чат. Якщо ж там буде наприклад непрочитаних 3, а завантажиться останнє з них, то два догрузяться потім, але тоді вже скорлл буде не з них, хоча мав би з них починатись
            if (chatRoom.last_message.message_iv) {
                if (isActiveRoom) {
                    decryptAndSetLastMessage(chatRoomKey, chatRoom.last_message);
                } else {
                    //console.log("Emptying the array?", chatRoom.unread_count > 1);
                    ChatRoomMessage.decryptMessage(chatRoomKey, chatRoom.last_message).then((dMessage) => {
                        //console.log(`Decrypted message`, dMessage);
                        setChatRooms(prev =>
                            prev.map(cr =>
                                cr.id === chatRoom.id ? { ...cr, messages: cr.unread_count > 1 ? [] : [dMessage], last_message: dMessage } : cr
                            )
                        );
                    });
                }
            } else {
                if (!isActiveRoom && chatRoom.unread_count > 1) {
                    //console.log("Emptying the array");
                    setChatRooms(prev =>
                        prev.map(cr => cr.id === chatRoom.id ? { ...cr, messages: [] } : cr)
                    );
                }
                /*
                setChatRooms(prev =>
                    prev.map(cr =>
                        cr.id === chatRoom.id ? { ...cr, last_message: chatRoom.last_message } : cr
                    )
                );*/
            }
        } else {
            setChatRooms(prev =>
                prev.map(cr =>
                    cr.id === chatRoom.id ? { ...cr, last_message: null } : cr
                )
            );
        }
    }, [chatRoomKey]);

    /*
    const markMessagesAsDelivered = (messageIds) => {
        axios.post(route('chat_rooms.messages.mark_as_delivered', chatRoom.id), {
            message_ids: messageIds
        }).catch(error => {

        })
    }*/

    const onChatRoomMessageSent = (e) => {
        //console.log("ChatRoom MessageSent");
        ChatRoomMessage.decryptMessage(chatRoomKeyRef.current, e.message).then((dMessage) => {
            //console.log("ChatRoom MessageSent message:", dMessage);

            const currentActiveChatRoom = activeChatRoomRef.current;
            //console.log(currentActiveChatRoom && currentActiveChatRoom.id === chatRoomRef.current.id);
            if (currentActiveChatRoom && currentActiveChatRoom.id === chatRoomRef.current.id) return;

            setChatRooms(prev =>
                prev.map(cr => {
                    if (cr.id === chatRoomRef.current.id) {
                        const isUserMessage = dMessage.user_id === user.id;
                        const newUnreadCount = isUserMessage ? 0 : (cr.unread_count || 0) + 1;

                        const updatedMessages = (isUserMessage || newUnreadCount < 10)
                            ? [...cr.messages, dMessage]
                            : [...cr.messages];

                        return {
                            ...cr,
                            messages: updatedMessages,
                            unread_count: newUnreadCount,
                            last_read_at: isUserMessage ? dMessage.created_at : cr.last_read_at,
                            last_message: dMessage,
                        };
                    }
                    return cr;
                })
            );

            if (!chatRoomRef.current.muted && dMessage.user_id !== user.id) {
                Utils.showNotification(`${chatRoomRef.current.title}`, {
                    body: `${dMessage.user.name}: ${dMessage.message}`,
                    tag: `${chatRoomRef.current.title}`,
                    renotify: true,
                });
                /*
                    .then(newNotification => {
                    if (newNotification) {
                        setNotification({ notification: newNotification, messageId: dMessage.id });
                    }
                });*/
            }
        });
    };

    const onChatRoomMessageRemoved = (e) => {
        (async () => {
            const messageToRemove = e.message;

            const currentActiveChatRoom = activeChatRoomRef.current;
            if (currentActiveChatRoom && currentActiveChatRoom.id === chatRoomRef.current.id) {
                return;
            }

            const messageId = chatRoomRef.current.messages.findIndex(m => m.id === messageToRemove.id);

            if (chatRoomRef.current.last_message?.id === messageToRemove.id) {
                const previousMessage = messageId !== -1 ? chatRoomRef.current.messages[messageId - 1] : null;
                const newLastMessage = previousMessage
                    ? previousMessage
                    : await axios.get(route("chat_rooms.messages.get_last_message", { chatRoom: chatRoom.id })).then(res => res.data);
                let updatedMessages = chatRoomRef.current.messages.filter(m => m.id !== messageToRemove.id);
                if (updatedMessages.length === 0) {
                    updatedMessages = [newLastMessage];
                }

                setChatRooms(prev =>
                    prev.map(cr => cr.id === chatRoomRef.current.id ?
                        { ...cr, messages: [...updatedMessages], last_message: { ...newLastMessage } } : cr)
                );
            }

            if (new Date(messageToRemove.createdAt) > new Date(chatRoomRef.current.last_read_at + "Z") && messageToRemove.user_id !== user.id) {
                setChatRooms(prev =>
                    prev.map(cr => cr.id === chatRoomRef.current.id ?
                        { ...cr, unread_count: Math.max((chatRoomRef.current.unread_count || 0) - 1, 0) } : cr)
                );
            }
        })();
    };

    const onUserOnlineStatusChanged = (e) => {
        const { user_id, is_online, last_seen_at } = e;
        const otherUser = chatRoomRef.current.users.find(u => u.id !== user.id);
        if (otherUser?.id === user_id) {
            setChatRooms(cr => cr.id === chatRoomRef.current.id ? {
                ...cr,
                is_online: is_online,
                last_seen_at: last_seen_at,
            } : cr);
            setIsOnline(is_online);
        }
    }

    useEffect(() => {
        Echo.private(channel)
            .listen('ChatRoomMessageSent', onChatRoomMessageSent)
            .listen('ChatRoomMessageRemoved', onChatRoomMessageRemoved)
            .listen('UserOnlineStatusChanged', onUserOnlineStatusChanged);

        return () => {
            Echo.private(channel)
                .stopListening('ChatRoomMessageSent')
                .stopListening('ChatRoomMessageRemoved')
                .stopListening('UserOnlineStatusChanged');
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
        const getWeekDay = (date) => date.toLocaleDateString('en-US', { weekday: 'short' });

        if (inputDate.toLocaleDateString() === currentDate.toLocaleDateString()) {
            return inputDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

                        {lastMessage && (<span className={`text-sm`}>{prettyCreatedAt(lastMessage.created_at)}</span>)}
                    </div>

                    <div className={`flex gap-0.5`}>
                        {chatRoom.unread_count > 0 && (
                            <div className="bg-red-500 text-white text-xs px-1 rounded-full inline-flex items-center justify-center h-4 min-w-4">
                                {chatRoom.unread_count > 99999 ? '99999+' : chatRoom.unread_count}
                            </div>
                        )}
                        <TrashIcon
                            className={`
                            size-4 opacity-0 group-hover:opacity-100 cursor-pointer
                            ${self ? 'text-lime-500 hover:text-lime-700 ' : 'text-yellow-500 hover:text-yellow-700 '}
                        `}
                            onClick={removeChatRoom}
                        />
                    </div>
                </div>

                {lastMessage && !lastMessage.message_iv && (
                    <div
                        className={`text-gray-400 ${safeViewIsOn && 'blur-sm group-hover:blur-0'}`}
                    >
                        {truncate(lastMessage.message, 20)}
                    </div>
                )}

            </div>
        </div>
    );
}
