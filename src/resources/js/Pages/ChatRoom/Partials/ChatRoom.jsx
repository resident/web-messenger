import { useContext, useEffect, useRef, useState } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";
import { default as CommonChatRoom } from "@/Common/ChatRoom.js";
import ChatRoomMessage from "@/Common/ChatRoomMessage.js";
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
    const [users, setUsers] = useState(chatRoom.users);

    const [isOnline, setIsOnline] = useState(false);
    const [members, setMembers] = useState(chatRoom.users.length);

    const activeChatRoomRef = useRef(activeChatRoom);
    const chatRoomRef = useRef(chatRoom);
    const chatRoomKeyRef = useRef(chatRoomKey);

    const channel = `chat-room.${chatRoom.id}`;

    const [otherUser, setOtherUser] = useState(null);

    useEffect(() => {
        setUsers(chatRoom.users);
        setMembers(chatRoom.users.length);
        if (chatRoom.users.length === 2) {
            setOtherUser(chatRoom.users.find(u => u.id !== user.id));
        } else {
            setOtherUser(null);
        }
    }, [chatRoom.users]);

    useEffect(() => {
        if (otherUser) {
            setIsOnline(otherUser.is_online);
        } else {
            setIsOnline(false);
        }
    }, [otherUser]);

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
        if (!chatRoom.last_message) return;

        if (chatRoom.last_message.message_iv && chatRoomKey) {
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
            setLastMessage(chatRoom.last_message);
        }

    }, [chatRoom.last_message, chatRoomKey]);

    useEffect(() => {
        // Це був активний чат
        if (activeChatRoomRef.current?.id === chatRoom?.id) {
            // Якщо та, що оновилась, вже не наша -- оновимо прослуховування
            if (!activeChatRoom || activeChatRoom.id !== activeChatRoomRef.current.id) {
                const channel = `chat-room.${chatRoom.id}`;
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
        const mLength = chatRoom.messages.length;
        if (mLength > 0 && chatRoom.messages[mLength - 1].message_iv && chatRoomKey) {
            decryptAndSetLastMessage(chatRoomKey, chatRoom.messages[mLength - 1]);
        }
    }, [chatRoom.messages]);

    useEffect(() => {
        if (!chatRoomKey) return;

        chatRoomKeyRef.current = chatRoomKey;

        if (chatRoom.messages.length) {
            const isActiveRoom = activeChatRoom && activeChatRoom.id === chatRoom.id;
            // Більше ніж 1 непрочитаних повідомлень -- вважаємо потім у ChatRoomMessages як initialLoading, тобто щоб всі повідомлення грузило там.
            // Оскільки це викликається тільки один раз при відображенні чату, то логіка використовується тільки для початкового завантаження
            // Саме 1 повідомлення через те, що з нього треба буде починати показувати сам чат. Якщо ж там буде наприклад непрочитаних 3, а завантажиться останнє з них, то два догрузяться потім, але тоді вже скорлл буде не з них, хоча мав би з них починатись
            if (chatRoom.last_message.message_iv) {
                if (isActiveRoom) {
                    decryptAndSetLastMessage(chatRoomKey, chatRoom.last_message);
                } else {
                    ChatRoomMessage.decryptMessage(chatRoomKey, chatRoom.last_message).then((dMessage) => {
                        setChatRooms(prev =>
                            prev.map(cr =>
                                cr.id === chatRoom.id ? {
                                    ...cr,
                                    messages: cr.unread_count > 1 ? [] : [dMessage],
                                    last_message: dMessage
                                } : cr
                            )
                        );
                    });
                }
            } else {
                if (!isActiveRoom && chatRoom.unread_count > 1) {
                    setChatRooms(prev =>
                        prev.map(cr => cr.id === chatRoom.id ? { ...cr, messages: [] } : cr)
                    );
                }
            }
        } else {
            setChatRooms(prev =>
                prev.map(cr =>
                    cr.id === chatRoom.id ? { ...cr, last_message: null } : cr
                )
            );
        }
    }, [chatRoomKey]);

    const onChatRoomMessageSent = (e) => {
        ChatRoomMessage.decryptMessage(chatRoomKeyRef.current, e.message).then((dMessage) => {

            const currentActiveChatRoom = activeChatRoomRef.current;
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
        setChatRooms(prev =>
            prev.map(cr => cr.id === chatRoom.id ? {
                ...cr,
                users: cr.users.map(user => user.id === user_id
                    ? { ...user, is_online, last_seen_at }
                    : user)
            } : cr));
    };

    useEffect(() => {
        //console.log("Calling here:", { chatRoomKey });
        Echo.private(channel)
            .listen('ChatRoomMessageSent', onChatRoomMessageSent)
            .listen('ChatRoomMessageRemoved', onChatRoomMessageRemoved)
            .listen('UserOnlineStatusChanged', onUserOnlineStatusChanged);

        return () => {
            //console.log("Closing here");
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

    // Коллаж
    const getCollageAvatars = () => {
        if (users.length <= 2) return [];
        let prioritizedUser = null;
        if (lastMessage?.user_id) {
            const found = users.find(u => u.id === lastMessage.user_id && u.avatar?.path);
            if (found) {
                prioritizedUser = found;
            }
        }

        let withAvatars = users.filter(u => u.avatar?.path);
        if (prioritizedUser) {
            withAvatars = withAvatars.filter(u => u.id !== prioritizedUser.id);
            withAvatars.unshift(prioritizedUser);
        }

        return withAvatars.slice(0, 4);
    }

    const renderCollage = () => {
        const collage = getCollageAvatars();
        const count = collage.length;
        if (count === 0) {
            return null;
        }

        if (users.length > 2 && count === 1) {
            return (
                <>
                    <img
                        src={`${import.meta.env.VITE_AVATARS_STORAGE}/${collage[0].avatar.path}`}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </>
            )
        }

        return (
            <div className="w-full h-full relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 z-0" />

                <div className="absolute left-0 top-0 w-1/2 h-full">
                    <img
                        src={`${import.meta.env.VITE_AVATARS_STORAGE}/${collage[0].avatar.path}`}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>

                <div className="absolute left-1/2 top-0 w-1/2 h-full flex flex-col items-center justify-evenly">
                    {count > 1 && collage.slice(1).map((u, idx) => (
                        <img
                            key={u.id}
                            src={`${import.meta.env.VITE_AVATARS_STORAGE}/${u.avatar.path}`}
                            className="w-full h-full object-cover"
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div
            //${activeChatRoom?.id === chatRoom.id ? 'bg-gradient-to-b from-[#BFDBFE] via-white to-white' : 'bg-gradient-to-b from-[#3B82F6] hover:from-blue-300 via-blue-300 hover:via-blue-100 to-blue-300  hover:to-blue-100'}
            className={`flex min-w-min
                ${activeChatRoom?.id === chatRoom.id ? 'bg-blue-200' : 'bg-blue-400 hover:bg-blue-200'}
                rounded-lg cursor-pointer group ${className} overflow-hidden`}
            onClick={onClickHandler}
        >
            <div className={`w-full`}>
                <div className={`flex justify-between`}>
                    <div>
                        {chatRoom.unread_count > 0 && (
                            <div
                                className="bg-blue-500 text-white mt-2 ml-2 text-xs px-1 rounded-full inline-flex items-center justify-center h-5 min-w-5">
                                {chatRoom.unread_count > 999 ? '999+' : chatRoom.unread_count}
                            </div>
                        )}
                    </div>

                    <div className={`flex gap-[14px] mt-2.5 mb-2`}>
                        <span
                            className={`font-bold text-lg text-nowrap 
                                ${activeChatRoom?.id === chatRoom.id ? 'text-black' : 'text-[#e0f4ff] group-hover:text-black'}`
                            }>
                            {users.length === 2
                                ? truncate(otherUser?.name ?? '', 15)
                                : truncate(chatRoom.title, 15)
                            }
                        </span>

                        <div className={`relative size-[53px] mr-[15px] items-center justify-center`}>
                            <div className="relative bg-blue-300 rounded-full overflow-hidden w-full h-full">
                                {users.length === 2 && otherUser && (
                                    otherUser?.avatar?.path ? (
                                        <img
                                            src={`${import.meta.env.VITE_AVATARS_STORAGE}/${otherUser.avatar.path}`}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    ) : null
                                )}
                                {users.length > 2 && renderCollage()}
                            </div>
                            {users.length === 2 && otherUser && (
                                <span
                                    className={`
                                        absolute top-0 right-0 size-2 rounded-full bg-blue-500 ring-white ring-2
                                    `}
                                />
                            )}
                        </div>
                    </div>


                </div>


                <div className={`
                            flex justify-between text-gray-600 rounded-lg
                            ${activeChatRoom?.id === chatRoom.id ? 'bg-white' : 'bg-blue-300 group-hover:bg-blue-100'}
                            text-sm py-[2px] px-3
                            ${safeViewIsOn && 'blur-sm group-hover:blur-0'}
                        `}
                >
                    {!lastMessage || lastMessage.message_iv ? (
                        <div className="italic">No messages...</div>
                    ) : (
                        <div className="flex justify-between w-full">
                            <div>
                                {lastMessage.user.name}: {truncate(lastMessage.message, 20)}
                            </div>

                            <div>{prettyCreatedAt(lastMessage.created_at)}</div>
                        </div>
                    )
                    }
                </div>
            </div>
        </div>
    );
}
