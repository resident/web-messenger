import { useContext, useEffect, useRef, useState } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";
import { default as CommonChatRoom } from "@/Common/ChatRoom.js";
import ChatRoomMessage from "@/Common/ChatRoomMessage.js";
import Utils from "@/Common/Utils.js";
import ChatAvatar from "./ChatAvatar";
import { router } from "@inertiajs/react";
import debounce from "lodash.debounce";

export default function ChatRoom({
    className = '',
    chatRoom,
    onClickHandler = chatRoom => null,
    subscribeToEvents = true
}) {
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
        if (chatRoom.last_message?.message_iv && chatRoomKey) {
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
        if (!subscribeToEvents) return;
        // Це був активний чат
        if (activeChatRoomRef.current?.id === chatRoom?.id) {
            // Якщо та, що оновилась, вже не наша -- оновимо прослуховування
            if (!activeChatRoom || activeChatRoom.id !== activeChatRoomRef.current.id) {
                const channel = `chat-room.${chatRoom.id}`;
                Echo.private(channel)
                    .stopListening('ChatRoomMessageSent')
                    .stopListening('ChatRoomMessageRemoved')
                    .stopListening('ChatRoomMessageStatusUpdated')
                    .stopListening('UserOnlineStatusChanged')
                    .stopListening('ChatRoomUpdated')
                    .listen('ChatRoomMessageSent', onChatRoomMessageSent)
                    .listen('ChatRoomMessageRemoved', onChatRoomMessageRemoved)
                    .listen('ChatRoomMessageStatusUpdated', onChatRoomMessageStatusUpdated)
                    .listen('UserOnlineStatusChanged', onUserOnlineStatusChanged)
                    .listen('ChatRoomUpdated', onChatRoomUpdated);
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
            if (chatRoom.last_message?.message_iv) {
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
                        let isNewer = true;
                        if (cr?.last_message?.created_at) {
                            const timeDifference = new Date(cr.last_message.created_at).getTime() - new Date(dMessage.created_at).getTime();
                            isNewer = timeDifference < 1000;
                        }

                        return {
                            ...cr,
                            messages: updatedMessages,
                            unread_count: newUnreadCount,
                            last_read_at: isUserMessage ? dMessage.created_at : cr.last_read_at,
                            last_message: isNewer ? dMessage : cr.last_message,
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

    const removeQueueRef = useRef([]);

    const handleRemoveQueueFlush = async () => {
        const removedMessages = [...removeQueueRef.current];
        removeQueueRef.current = [];

        if (removedMessages.length === 0) return;

        removedMessages.sort((a, b) =>
            new Date(a.createdAt) - new Date(b.createdAt)
        );

        let needNewLastMessage = false;
        let newestRemoved = null;
        removedMessages.forEach(msg => {
            if (chatRoomRef.current.last_message?.id === msg.id) {
                needNewLastMessage = true;
            }
            if (
                !newestRemoved ||
                new Date(msg.createdAt) > new Date(newestRemoved.createdAt)
            ) {
                newestRemoved = msg;
            }
        });

        let newLastMessage = chatRoomRef.current.last_message;
        if (needNewLastMessage) {
            const allCurrent = chatRoomRef.current.messages;
            const oldestRemovedMessage = removedMessages.reduce((oldest, current) =>
                new Date(current.createdAt) < new Date(oldest.createdAt)
                    ? current
                    : oldest
            );

            const oldestRemovedTimestamp = new Date(oldestRemovedMessage.createdAt);
            const sortedCurrentMessages = [...allCurrent].sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
            );
            newLastMessage = sortedCurrentMessages.find(
                (msg) => new Date(msg.created_at) < oldestRemovedTimestamp
            );

            if (!newLastMessage) {
                const res = await axios.get(
                    route("chat_rooms.messages.get_last_message", {
                        chatRoom: chatRoom.id,
                    })
                );
                newLastMessage = Object.keys(res.data).length === 0 ? null : res.data;
            }

            setChatRooms(prev =>
                prev.map(cr =>
                    cr.id === chatRoomRef.current.id
                        ? { ...cr, last_message: newLastMessage }
                        : cr
                )
            );
        }

        const unreadDecrementCount = removedMessages.reduce((count, msg) => {
            const wasUnread =
                new Date(msg.createdAt) >
                new Date(chatRoomRef.current.last_read_at + "Z") &&
                msg.userId !== user.id;
            return wasUnread ? count + 1 : count;
        }, 0);

        if (unreadDecrementCount > 0) {
            setChatRooms(prev =>
                prev.map(cr => {
                    if (cr.id === chatRoomRef.current.id) {
                        const newUnreadCount = Math.max(
                            (chatRoomRef.current.unread_count || 0) -
                            unreadDecrementCount,
                            0
                        );
                        return { ...cr, unread_count: newUnreadCount };
                    }
                    return cr;
                })
            );
        }

        let updatedMessages = chatRoomRef.current.messages.filter(m => !removedMessages.some(rm => m.id === rm.id));
        const newUnreadCount = Math.max(
            (chatRoomRef.current.unread_count || 0) -
            unreadDecrementCount,
            0
        );
        if (updatedMessages.length === 0 && newUnreadCount < 2 && newLastMessage) {
            updatedMessages = [newLastMessage];
        }

        setChatRooms(prev =>
            prev.map(cr => cr.id === chatRoomRef.current.id ?
                { ...cr, messages: updatedMessages } : cr)
        );
    }

    const debouncedRemoveFlush = useRef(
        debounce(() => {
            handleRemoveQueueFlush();
        }, 200)
    ).current;

    const handleChatRoomMessageRemovedBase = (message) => {
        removeQueueRef.current.push(message);
    }

    const onChatRoomMessageRemoved = (e) => {
        const messageToRemove = e.message;

        const currentActiveChatRoom = activeChatRoomRef.current;
        if (currentActiveChatRoom && currentActiveChatRoom.id === chatRoomRef.current.id) {
            return;
        }

        handleChatRoomMessageRemovedBase(messageToRemove);
        debouncedRemoveFlush();
    };

    const onChatRoomMessageStatusUpdated = (e) => {
        const updatedMessage = e.message;

        const currentActiveChatRoom = activeChatRoomRef.current;
        if (currentActiveChatRoom && currentActiveChatRoom.id === chatRoomRef.current.id) return;

        setChatRooms(prev =>
            prev.map(cr => cr.id === chatRoom.id ? {
                ...cr,
                messages: cr.messages.map(msg => msg.id === updatedMessage.id
                    ? { ...msg, status: updatedMessage.status }
                    : msg)
            } : cr));
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

    const onChatRoomUpdated = (e) => {
        if (e.changes.is_deleted || e.changes.deleted_user?.id === user.id) {
            const currentActiveChatRoom = activeChatRoomRef.current;
            if (currentActiveChatRoom && currentActiveChatRoom.id === chatRoomRef.current.id) {
                router.get(route('main'), {}, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: []
                });
            }
            setChatRooms(prev => prev.filter(cr => cr.id !== e.chatRoomId));
        } else {
            const { updated_user, added_user, deleted_user, ...restChanges } = e.changes;

            setChatRooms(prev => prev.map(cr => {
                if (cr.id !== e.chatRoomId) {
                    return cr;
                }

                let updatedUsers = cr.users;
                if (updated_user) {
                    updatedUsers = cr.users.map(u =>
                        u.id === updated_user.id
                            ? {
                                ...u,
                                pivot: {
                                    ...u.pivot,
                                    role_name: updated_user.role_name,
                                    permissions: updated_user.permissions,
                                }
                            }
                            : u
                    );
                }
                if (added_user) {
                    const alreadyExists = updatedUsers.some(u => u.id === added_user.id);
                    if (!alreadyExists) {
                        updatedUsers = [...updatedUsers, added_user];
                    }
                }
                if (deleted_user) {
                    updatedUsers = updatedUsers.filter(u => u.id !== deleted_user.id)
                }

                return {
                    ...cr,
                    ...restChanges,
                    users: updatedUsers,
                };
            }));
        }
    };

    useEffect(() => {
        if (!subscribeToEvents) return;
        //console.log("Calling here:", { chatRoomKey });
        Echo.private(channel)
            .listen('ChatRoomMessageSent', onChatRoomMessageSent)
            .listen('ChatRoomMessageRemoved', onChatRoomMessageRemoved)
            .listen('ChatRoomMessageStatusUpdated', onChatRoomMessageStatusUpdated)
            .listen('UserOnlineStatusChanged', onUserOnlineStatusChanged)
            .listen('ChatRoomUpdated', onChatRoomUpdated);

        return () => {
            //console.log("Closing here");
            Echo.private(channel)
                .stopListening('ChatRoomMessageSent')
                .stopListening('ChatRoomMessageRemoved')
                .stopListening('ChatRoomMessageStatusUpdated')
                .stopListening('UserOnlineStatusChanged')
                .stopListening('ChatRoomUpdated');
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
                            <ChatAvatar
                                users={users}
                                localUser={user}
                                lastMessage={lastMessage}
                                size="full"
                                showOnlineBadgeForSecondUser={isOnline}
                            />
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
                    {(!lastMessage || Object.keys(lastMessage).length === 0 || lastMessage.message_iv) ? (
                        <div className="italic">No messages...</div>
                    ) : (
                        <div className="flex justify-between w-full">
                            <div>
                                {lastMessage?.user?.name}: {truncate(lastMessage.message, 20)}
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
