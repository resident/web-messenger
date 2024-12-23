import ChatMessage from "@/Pages/ChatRoom/Partials/ChatMessage.jsx";
import TextArea from "@/Components/TextArea.jsx";
import PrimaryButton from "@/Components/PrimaryButton.jsx";
import SelectAttachments from "@/Pages/ChatRoom/Partials/SelectAttachments.jsx";
import AutoDeleteSettings from "@/Pages/ChatRoom/Partials/AutoDeleteSettings.jsx";
import { ChatRoomContextProvider } from "@/Pages/ChatRoom/ChatRoomContext.jsx";
import { cache, useContext, useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";
import Emojis from "@/Components/Emojis.jsx";
import ChatRoom from "@/Common/ChatRoom.js";
import ChatRoomMessage from "@/Common/ChatRoomMessage.js";
import RecordAudioMessage from "./RecordAudioMessage";
import axios, { all } from "axios";
import Utils from "@/Common/Utils.js";
import useStorage from "@/Common/LocalStorage";
import isEqual from 'lodash.isequal';
import debounce from "lodash.debounce";

export default function ChatRoomMessages({ ...props }) {
    const {
        user,
        userPrivateKey,
        chatRooms, setChatRooms,
        activeChatRoom, setActiveChatRoom,
        userIsOnline,
    } = useContext(ApplicationContext);

    const [chatRoom, setChatRoom] = useState(props.chatRoom);
    const [chatRoomKey, setChatRoomKey] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [hasMessages, setHasMessages] = useState(false);
    const [errors, setErrors] = useState({});
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [removingMessage, setRemovingMessage] = useState();
    const [messagesOperation, setMessagesOperation] = useState(null);
    const [messageAttachments, setMessageAttachments] = useState([]);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [prevMessagesLength, setPrevMessagesLength] = useState(0);
    const [scrollTo, setScrollTo] = useState(null);
    const [scrollState, setScrollState] = useState('middle');
    const [messageSelectionStart, setMessageSelectionStart] = useState(0);
    const [messageSelectionEnd, setMessageSelectionEnd] = useState(0);

    const [pendingMessages, setPendingMessages] = useState([]);
    const [allMessages, setAllMessages] = useState([]);

    const [cacheLoading, setCacheLoading] = useState(false);

    // 0 - базова
    // 1 - Початок процесу завантаження повідомлень
    // 2 - Кінець процесу завантаження повідомлень
    const [initialLoading, setInitialLoading] = useState(0);

    const [lastMessage, setLastMessage] = useState(props.chatRoom.last_message);

    const [shouldScroll, setShouldScroll] = useState(false);

    const messagesRef = useRef();
    const messageRefs = useRef([]);
    const messageInputRef = useRef();

    const [windowStartIndex, setWindowStartIndex] = useState(0);
    const VISIBLE_COUNT = 50;
    const [pendingShift, setPendingShift] = useState(null);

    const STORAGE_KEY = `chatRoomStates`;
    const { getChatState, setChatState, removeChatState } = useStorage(STORAGE_KEY);
    const [restoringState, setRestoringState] = useState(1);
    const lastKnownScrollTopRef = useRef(0);
    const lastKnownWindowStartIndexRef = useRef(windowStartIndex);
    const lastKnownAnchorMessageIdRef = useRef(null);

    const [shouldPreventShift, setShouldPreventShift] = useState(false);

    const messagesOperationTypes = Object.freeze({
        push: 'push',
        remove: 'remove',
    });

    const scrollToDirection = Object.freeze({
        top: 'top',
        bottom: 'bottom',
    });

    const chatRoomRef = useRef(chatRoom);

    useEffect(() => {
        chatRoomRef.current = chatRoom;
    }, [chatRoom]);

    const userIsOnlineRef = useRef(userIsOnline);
    useEffect(() => {
        userIsOnlineRef.current = userIsOnline;
    }, [userIsOnline]);

    const allMessagesRefs = useRef(allMessages);

    useEffect(() => {
        allMessagesRefs.current = allMessages;

        const realMessages = allMessages.filter(message => !message.isPlaceholder);
        const placeholderMessages = allMessages.filter(message => message.isPlaceholder);

        if (!isEqual(messages, realMessages)) {
            setMessages(realMessages);
        }
        if (!isEqual(pendingMessages, placeholderMessages)) {
            setPendingMessages(pendingMessages);
        }
    }, [allMessages]);

    const addUniqueMessages = (currentMessages, newMessages, isUpper) => {
        const existingIds = new Set(currentMessages.map(m => m.id));
        const uniqueMessages = newMessages.filter(
            message => !existingIds.has(message.id)
        );
        return isUpper ? [...uniqueMessages, ...currentMessages] : [...currentMessages, ...uniqueMessages];
    };

    useEffect(() => {
        const freshChatRoom = chatRooms.find(chat => chat.id === chatRoom.id);
        if (freshChatRoom) {
            setChatRoom(freshChatRoom);
        }
    });

    useEffect(() => {
        setLastMessage(chatRoom.last_message);
    }, [chatRoom.last_message]);

    // 1 - Встановлюємо ключ
    useEffect(() => {
        if (userPrivateKey) {
            setActiveChatRoom(chatRoom);

            const chatRoomKeyEnc = chatRoom.users.find(u => u.id === user.id).pivot.chat_room_key;

            ChatRoom.decryptChatRoomKey(userPrivateKey, chatRoomKeyEnc).then(chatRoomKey => {
                setChatRoomKey(chatRoomKey);
            });

            return () => {
                setActiveChatRoom(null);
            };
        } else {
            setChatRoomKey(null);
        }
    }, [chatRoom]);

    // 2 - Завантаження чату, додаються повідомлення, які вже є у chatRooms.chatRoom.messages
    //     Підключення до каналу і слухачів
    useEffect(() => {
        const channelName = `chat-room.${chatRoom.id}`;
        const channel = Echo.private(channelName);
        let isMounted = true;

        if (chatRoomKey) {
            const decryptMessages = async () => {
                try {
                    const processedMessages = await Promise.all(
                        chatRoom.messages.map(async (m) => {
                            if (m.message_iv) {
                                return await ChatRoomMessage.decryptMessage(chatRoomKey, m);
                            }
                            return m;
                        })
                    );
                    if (isMounted) {
                        setAllMessages([...processedMessages]);
                    }
                } catch (error) {
                    console.error("Error decrypting messages:", error);
                }
            };

            if (initialLoading === 0 && chatRoom) {
                // Як і в телеграмі, якщо до нас не прийшли повідомлення (у випадку коли або взагалі їх немає, або коли початково завантажених (ChatRoomsController->list) unread_count там > 10)
                // Тоді завантажуємо просто 20 повідомлень, з сервера прийде до 10 нових і до 10 старих, разом максимум 20

                if (chatRoom.messages.length === 0) {
                    //console.log("There are no messages");
                    setRestoringState(0);
                    loadMessages(20, null, false, false, false);
                } else {
                    setCacheLoading(true);
                    decryptMessages();
                }
            }

            channel
                .stopListening('ChatRoomMessageSent')
                .stopListening('ChatRoomMessageRemoved')
                .stopListening('ChatRoomUpdated')
                .stopListening('ChatRoomMessageStatusUpdated')
                .listen('ChatRoomMessageSent', onChatRoomMessageSent) // у випадку активності чата (тобто цей чат відкритий) контроль над ChatRoomMessageSent перехватується цим компонентом
                .listen('ChatRoomMessageRemoved', onChatRoomMessageRemoved) // так само
                .listen('ChatRoomUpdated', onChatRoomUpdated)
                .listen('ChatRoomMessageStatusUpdated', onChatRoomMessageStatusUpdated);
        } else {
            setAllMessages([]);
        }

        return () => {
            channel
                .stopListening('ChatRoomMessageSent')
                .stopListening('ChatRoomMessageRemoved')
                .stopListening('ChatRoomUpdated')
                .stopListening('ChatRoomMessageStatusUpdated');

            isMounted = false;
        };
    }, [chatRoomKey]);

    const isLoadingMoreRef = useRef(0);

    // Викликається для завантаження вгору і вниз, як мануально, так і автоматично (розрахунок кількості повідомлень на завантаження)
    const loadMore = (manual = false, count = 0, startId = 0, upperLoad = false, lowerLoad = false, lastMess = false) => {
        if (!messagesRef.current) return;

        if (manual) {
            const prevCount = allMessages.length;
            setPendingShift({ direction: upperLoad ? "up" : "down", prevCount });
            isLoadingMoreRef.current = 1;
            loadMessages(count, startId, upperLoad, lowerLoad);
        }
        else {
            // Найбільш вірогідно викликається при автоматичному запуску, тобто коли нам треба довантажити повідомлення
            // Коли заходимо у чат і кількість недостатня (до 20)
            // Коли скролимо вниз і тоді знову треба завантажувати (можливо в майбутньому замість last_message буде last_messages ~ 5-6 повідомлень, щоб було краще з візуальної точки зору)
            if (messages.length >= 20) {
                setInitialLoading(2);
                //setRestoringState(1);
                isLoadingMoreRef.current = 0;
                return;
            }
            setRestoringState(0);

            const unreadCount = messages.filter(
                m => new Date(m.created_at) > new Date(chatRoom.last_read_at)
            ).length;
            const n = Math.min(unreadCount, 10);
            const messagesToLoad = 20 - n;

            startId = messages[0]?.id;
            setPendingShift({ direction: upperLoad ? "up" : "down", prevCount: allMessages.length });
            isLoadingMoreRef.current = 1;
            loadMessages(messagesToLoad, startId, upperLoad, lowerLoad);
        }
    };

    // 3- Довантажуємо повідомлення (в залежності від того, які прийшли до нас на початку)
    // Викликається або (1) на початку, або (2) коли відбувся скрол вниз і там розрив повідомлень
    useEffect(() => {
        if (!cacheLoading) return;
        if (messages.length <= 0) return;
        // У випадку наявних повідомлень, робимо перевірку, обов'язково має бути мінімум 10 повідомлень прочитаних
        // Робимо перевірку на таку кількість, якщо їх менше, то довантажуємо "вгору", щоб добити відповідну кількість
        // При тому враховується, що максимальна непрочитана кількість повідомлень, яка може сюди прийти (з chatRooms) становить 10
        // Таким чином, рахуємо кількість непрочитаних n, потім 20 - n і отримуємо кількість, що треба завантажити вгору
        setCacheLoading(false);
        loadMore(false, 0, 0, true, false, false);
    }, [messages]);

    // Спрацьовує, коли ми довантажуємо (самі) повідомлення вгору/вниз
    useEffect(() => {
        if (isLoadingMoreRef.current === 2) {
            isLoadingMoreRef.current = 0;

            const shift = 10;
            const loaded = allMessages.length - pendingShift.prevCount;

            if (pendingShift && pendingShift.direction === "up") {
                if (allMessages.length > VISIBLE_COUNT) {
                    if (windowStartIndex > shift) {
                        setWindowStartIndex(prev => Math.max(0, prev - shift + (loaded >= shift ? loaded : 0)));
                    } else {
                        setWindowStartIndex(prev => Math.min(prev + loaded, prev + shift));
                    }
                }
                setPendingShift(null);
            } else if (pendingShift && pendingShift.direction === "down") {
                if (allMessages.length > VISIBLE_COUNT) {
                    if (windowStartIndex + VISIBLE_COUNT >= (allMessages.length - loaded)) {
                        setWindowStartIndex(prev => Math.min(prev + shift, allMessages.length - VISIBLE_COUNT));
                    } else {
                        //
                    }
                }
                setPendingShift(null);
            }
        }
    }, [allMessages, pendingShift]);

    // Virtualization
    const windowMessages = useMemo(() => {
        let start = windowStartIndex;
        if (start < 0) start = 0;
        let end = start + VISIBLE_COUNT;
        if (end > allMessages.length) end = allMessages.length;
        return allMessages.slice(start, end);
    }, [allMessages, windowStartIndex]);

    // N2 - Коли змінюються повідомлення, треба змінити і у chatRooms
    useEffect(() => {
        const check = initialLoading !== 0 && chatRooms?.length > 0 &&
            (chatRoom?.messages.length !== allMessages.length || chatRoom.messages[chatRoom.messages.length - 1] !==
                allMessages[allMessages.length - 1]);
        if (check) {
            setChatRooms(prev =>
                prev.map(cr => cr.id === chatRoom.id ? { ...cr, messages: allMessages } : cr)
            );
        }
    }, [allMessages, windowMessages]);

    useLayoutEffect(() => {
        if (windowMessages.length > 0) {
            setHasMessages(true);
        } else {
            setHasMessages(false);
        }
    }, [allMessages, windowMessages]);

    useLayoutEffect(() => {
        if (shouldScroll && scrollTo === "bottom" && messageRefs.current.length > 0) {
            const lastMessageEl = messageRefs.current[messageRefs.current.length - 1];
            if (lastMessageEl) {
                lastMessageEl.scrollIntoView({ behavior: 'instant', block: 'start' });
            }
            setScrollTo(null);
            setShouldScroll(false);
        }
    }, [allMessages, shouldScroll, scrollTo, messageRefs]);

    // 4 - Завантажуємо нові повідомлення, для будь-яких випадків, 
    // початкове завантаження (!upperload && !lowerload), 
    // завантаження вгору (upperload), завантаження вниз (lowerload)
    const loadMessages = (count = null, startId = null, upperload = false, lowerload = false, lastMess = false) => {
        if (messagesLoading) return;
        setMessagesLoading(true);
        setPrevMessagesLength(allMessages.length);

        axios.get(route('chat_rooms.messages.index', { chatRoom: chatRoom.id, count, startId, upperload, lowerload, lastMess }))
            .then(async (response) => {
                const loadedMessages = await Promise.all(
                    response.data.map(async (message) => {
                        return await ChatRoomMessage.decryptMessage(chatRoomKey, message);
                    })
                );
                if (initialLoading === 0) {
                    setInitialLoading(1);
                }
                if (isLoadingMoreRef.current === 1) {
                    isLoadingMoreRef.current = 2;
                }

                if (upperload) {
                    setAllMessages(prev => addUniqueMessages(prev, loadedMessages, true));
                } else if (lowerload) {
                    setAllMessages(prev => addUniqueMessages(prev, loadedMessages, false));
                } else {
                    setAllMessages(() => loadedMessages);
                }
            })
            .finally(() => {
                setMessagesLoading(false);
            });
    };

    // 5 - Тільки у випадку завантаження початкового, коли є непрочитані повідомлення, скролиться до них
    useLayoutEffect(() => {
        if (initialLoading !== 1) return;

        let firstUnreadId = -1;
        if (chatRoom.last_read_at) {
            const lastReadAtUTC = new Date(chatRoom.last_read_at + 'Z');

            firstUnreadId = allMessages.findIndex(
                m => new Date(m.created_at) >= lastReadAtUTC
            );
        } else {
            firstUnreadId = allMessages.length - 1;
        }

        const targetIndex = firstUnreadId >= 0 ? firstUnreadId : (allMessages.length - 1);
        if (targetIndex >= 0) {
            scrollToMessage(targetIndex, true);
        }

        setTimeout(() => {
            setInitialLoading(2);
        }, 0);
    }, [allMessages]);

    const setMessageRef = (el, index) => {
        messageRefs.current[index] = el;
    };

    const scrollToMessage = (globalIndex, centered = false) => {
        // Індекси приходять в залежності від саме всього, шукається у allMessages
        const el = messageRefs.current[globalIndex];
        if (centered) {
            const container = messagesRef.current;
            if (el && container) {
                const containerRect = container.getBoundingClientRect();
                const elementRect = el.getBoundingClientRect();

                const elementCenterOffset = (elementRect.top + elementRect.bottom) / 2;
                const containerCenterOffset = (containerRect.top + containerRect.bottom) / 2;
                const diff = elementCenterOffset - containerCenterOffset;

                container.scrollTop += diff;
            }
        } else {
            if (el) {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        el.scrollIntoView({
                            behavior: 'instant',
                            block: 'start',
                        });
                    })
                })
            }
        }
        setScrollTo(null);
    };

    // Викликається у двох випадках:
    // 1 - Якщо людина надсилає своє повідомлення, її одразу перекидує в самий низ
    // --- Коли pendingMessage та коли performSend message
    // 2 - Якщо людина натискає на кнопку вниз (ще треба доробити її)
    // 3 - Якщо людина вже внизу і їй приходить нове повідомлення
    const scrollToLastMessage = (isVirtualizing, isLastMessageLoaded, sendingMessage = null) => {
        if (chatRoomRef.current.unread_count > 0) {
            setChatRooms(prev =>
                prev.map(cr => cr.id === chatRoom.id ? { ...cr, unread_count: 0 } : cr)
            );
        }
        //console.log("Is Last Message loaded?", { isLastMessageLoaded });
        // Якщо є gap (не збігаються останні повідомлення), стираються всі з allMessages, додається lastMessage в messages, завантажуємо зверху повідомлення (cacheLoading)
        if (!isLastMessageLoaded) { // Це працює тільки для надсилання свого повідомлення або кнопки "вниз"
            //setMessages([]);
            //setPendingMessages([]);
            setAllMessages([]);
            setInitialLoading(0);
            //console.log("LastMessage?", {
            //    chatRoomRefLastMessage: chatRoomRef.current.last_message,
            //    chatRoomLastMessage: chatRoom.last_message,
            //    lastMessage: lastMessage,
            //});
            if (!chatRoomRef.current.last_message) {
                // Якщо виявляється, що lastMessage не завантажене в нас, робимо upperLoad починаючи з останнього повідомлення lastMessage = true
                setTimeout(() => {
                    loadMessages(20, null, true, false, true)
                }, 0);
            } else {
                // Якщо lastMessage існує, то ставимо його в messages і починаємо від нього загрузку у cacheLoading
                setCacheLoading(true);
                setTimeout(() => {
                    //console.log("What message are we sending?", sendingMessage);
                    if (sendingMessage) {
                        setAllMessages([lastMessage, sendingMessage]);
                    } else {
                        setAllMessages([lastMessage]);
                    }
                }, 0);
            }
        } else { // Це працює для надсилання свого повідомлення, кнопки "вниз" та отримання нового повідомлення (коли вже точно wasAtBottomAllMessages та isNearBottomOfScroll)
            if (shouldScroll) {
            }
            setWindowStartIndex(prev => {
                const newIndex = Math.max(0, allMessagesRefs.current.length - VISIBLE_COUNT);
                return newIndex;
            });
            setShouldScroll(true);
            setScrollTo(scrollToDirection.bottom);
        }
    }

    useEffect(() => {
        if (messagesOperation) {

            switch (messagesOperation.type) {
                case messagesOperationTypes.push: {
                    setAllMessages(prev => addUniqueMessages(prev, [messagesOperation.message], false));
                    break;
                }

                case messagesOperationTypes.remove: {
                    setAllMessages(prev => prev.filter(m => m.id !== messagesOperation.message.id));
                    break;
                }
            }

            setMessagesOperation(null);
        }

    }, [messages, messagesOperation]);

    const onChatRoomMessageSent = (e) => {
        (async () => {
            try {
                const dMessage = await ChatRoomMessage.decryptMessage(chatRoomKey, e.message);

                const wasAtBottom = (lastKnownWindowStartIndexRef.current + VISIBLE_COUNT >= allMessagesRefs.current.length);

                const isLastMessageLoaded = allMessagesRefs.current.some(m => m.id === chatRoomRef.current.last_message?.id);

                const { scrollTop, scrollHeight, clientHeight } = messagesRef.current || {};
                const isNearBottom = scrollHeight - (scrollTop + clientHeight) <= 200;

                const isVirtualizing = allMessagesRefs.current.length > VISIBLE_COUNT;

                if (isLastMessageLoaded) {
                    setChatRooms(prev =>
                        prev.map(cr => {
                            if (cr.id === chatRoomRef.current.id) {
                                const isUserMessage = dMessage.user_id === user.id;
                                let isNewer = true;
                                if (cr.last_message) {
                                    isNewer = new Date(dMessage.created_at) > new Date(cr.last_message.created_at);
                                }

                                // У випадку, якщо ми біля низу і тоді автоматично прочитується повідомлення, last_read_at можна не записувати, оскільки це буде відповідати observer і onMessageRead
                                // Не додається нічого до unread_count, оновлюється останнє повідомлення
                                if (isNearBottom && wasAtBottom && isNewer) { // Доробити для онлайн режиму
                                    return {
                                        ...cr,
                                        last_message: dMessage,
                                    }
                                } else {
                                    // Якщо ж ми знаходимось не в кінці чату, то додається кількість непрочитаних unread_count, 
                                    // observer не виконується одразу ж, 
                                    // отже маємо два випадки або користувач прогляне сам і тоді буде observer, або ж це прийшло повідомлення з нашого користувача (інший девайс наприклад)
                                    // тоді оновлюємо last_read_at як dMessage.created_at, інакше cr.last_read_at
                                    // Оновлюємо останнє повідомлення last_message
                                    const newUnreadCount = isUserMessage ? 0 : (cr.unread_count || 0) + 1;

                                    return {
                                        ...cr,
                                        unread_count: newUnreadCount,
                                        last_read_at: isUserMessage ? dMessage.created_at : cr.last_read_at,
                                        last_message: isNewer ? dMessage : cr.last_message,
                                    }
                                }
                            }
                            return cr;
                        })
                    );

                    // Не дає shift зробити автоматичний скролл
                    if (wasAtBottom && !isNearBottom) {
                        setShouldPreventShift(true);
                    }

                    setAllMessages(prev => addUniqueMessages(prev, [dMessage], false));

                    if (wasAtBottom && isNearBottom) {
                        requestAnimationFrame(() => {
                            setTimeout(() => {
                                /*if (messages.some(m => m.id === dMessage.id)) {
                                    console.log("Added message from sent");
                                }
                                console.log("Going into scrollToLastMessage");*/
                                scrollToLastMessage(isVirtualizing, isLastMessageLoaded);
                            }, 20);
                        });
                    }
                } else {
                    // В цьому випадку, якщо існує певний gap між завантаженими повідомленнями і останнім (тобто наприклад не завантажили ще 20 повідомлень з сервера)
                    // Тоді просто змінюємо last_message, додаємо unread_count, без pushMessage
                    setChatRooms(prev =>
                        prev.map(cr => {
                            if (cr.id === chatRoomRef.current.id) {
                                const isUserMessage = dMessage.user_id === user.id;
                                const newUnreadCount = isUserMessage ? 0 : (cr.unread_count || 0) + 1;
                                let isNewer = true;
                                if (cr.last_message) {
                                    isNewer = new Date(dMessage.created_at) > new Date(cr.last_message.created_at);
                                }
                                return {
                                    ...cr,
                                    unread_count: newUnreadCount,
                                    last_read_at: isUserMessage ? dMessage.created_at : cr.last_read_at,
                                    last_message: isNewer ? dMessage : cr.last_message,
                                }
                            }
                            return cr;
                        })
                    );
                }

                const notif = !isNearBottom && !userIsOnlineRef.current && !chatRoomRef.current.muted && dMessage.user_id !== user.id;
                if (notif) {
                    Utils.showNotification(`${chatRoomRef.current.title}`, {
                        body: `${dMessage.user.name}: ${dMessage.message}`,
                        tag: `${chatRoomRef.current.title}`,
                        renotify: true,
                    });
                }
            } catch (error) {
                console.error("Error handling ChatRoomMessageSent:", error);
            }
        })();
    };

    const onChatRoomMessageRemoved = (e) => {
        (async () => {
            const messageToRemove = e.message;

            const messagesArray = messagesRefs.current;
            const messageId = messagesArray.findIndex(m => m.id === messageToRemove.id);

            if (chatRoomRef.current.last_message?.id === messageToRemove.id) {
                const previousMessage = messageId !== -1 ? messagesArray[messageId - 1] : null;
                const newLastMessage = previousMessage
                    ? previousMessage
                    : await axios.get(route("chat_rooms.messages.get_last_message", { chatRoom: chatRoom.id })).then(res => res.data);

                setChatRooms(prev =>
                    prev.map(cr => cr.id === chatRoomRef.current.id ? { ...cr, last_message: newLastMessage } : cr)
                );
            }

            const check = new Date(messageToRemove.createdAt) > new Date(chatRoomRef.current.last_read_at + "Z") && messageToRemove.user_id !== user.id;
            if (check) {
                setChatRooms(prev =>
                    prev.map(cr => {
                        if (cr.id === chatRoomRef.current.id) {
                            const newUnreadCount = Math.max((chatRoomRef.current.unread_count || 0) - 1, 0);
                            return { ...cr, unread_count: newUnreadCount }
                        }
                        return cr;
                    })
                );
            }

            if (messageId !== -1) {
                removeMessage(messageToRemove);
            }
        })();
    };

    const onChatRoomUpdated = (e) => {
        setChatRoom({ ...chatRoom, ...e.chatRoom });
    };

    const onChatRoomMessageStatusUpdated = (e) => {
        const updatedMessage = e.message;

        setAllMessages(prev => prev.map(
            msg => msg.id === updatedMessage.id ? { ...msg, status: updatedMessage.status } : msg
        ));
    };

    const normalizeToSimpleFormat = (isoDateString) => {
        if (!isoDateString) return null;

        const date = new Date(isoDateString);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const isScheduleUpdatingRef = useRef(false);
    const scheduleLastReadAtMessagesRef = useRef(new Set());
    const updateLastReadAtDebounced = useRef(null);

    useEffect(() => {
        updateLastReadAtDebounced.current = debounce(() => {
            if (isScheduleUpdatingRef.current) return;
            isScheduleUpdatingRef.current = true;

            const scheduledMessages = Array.from(scheduleLastReadAtMessagesRef.current);
            if (scheduledMessages.length === 0) {
                isScheduleUpdatingRef.current = false;
                return;
            }

            const newestMessage = scheduledMessages.reduce((latest, current) =>
                new Date(current.created_at) > new Date(latest.created_at) ? current : latest,
            );
            const lastReadAtTime = normalizeToSimpleFormat(newestMessage.created_at);

            axios.post(route('chat_rooms.last_read_at.update', { chatRoom: chatRoom.id }), {
                last_read_at: lastReadAtTime,
            }).then(() => {
                scheduleLastReadAtMessagesRef.current = new Set(Array.from(scheduleLastReadAtMessagesRef.current).filter(
                    m => new Date(m.created_at) > new Date(lastReadAtTime + "Z")
                ));
            }).catch(error => {
                //console.error("Error updating last_read_at:", error);
                scheduleLastReadAtMessagesRef.current = new Set([...scheduleLastReadAtMessagesRef.current, ...scheduledMessages]);
            }).finally(() => {
                //console.debug("Clearing timerLastReadAt");
                isScheduleUpdatingRef.current = false;
            });
        }, 5000);

        return () => {
            if (updateLastReadAtDebounced.current) {
                updateLastReadAtDebounced.current.flush();
            }
        }
    }, []);

    const addMessageToSchedule = (message) => {
        if (!Array.from(scheduleLastReadAtMessagesRef.current).some(m => m.id === message.id)) {
            scheduleLastReadAtMessagesRef.current = [...scheduleLastReadAtMessagesRef.current, message];

            updateLastReadAtDebounced.current();
        }
    }

    const readMessagesQueueRef = useRef(new Set());
    const debounceUpdateRef = useRef(null);
    const isQueueUpdatingRef = useRef(false);

    //const debounce = (fn, delay) => {
    //    let timer = null;
    //    return (...args) => {
    //        if (timer) clearTimeout(timer);
    //        timer = setTimeout(() => {
    //            fn(...args);
    //            timer = null;
    //        }, delay);
    //    };
    //};

    const initialLoadingRef = useRef(initialLoading);
    const messagesRefs = useRef(messages);
    useEffect(() => {
        initialLoadingRef.current = initialLoading;
    }, [initialLoading]);

    useEffect(() => {
        messagesRefs.current = messages;
    }, [messages]);

    const onMessageRead = (message) => {
        //if (initialLoadingRef.current !== 2) return;
        //if (isLoadingMoreRef.current !== 0) return;
        //if (messagesLoading) return;

        const messageTime = new Date(message.created_at);
        const lastReadTime = new Date(chatRoomRef.current.last_read_at + ".000Z");

        // Повідомлення вже було прочитано
        if (messageTime <= lastReadTime) {
            return;
        }

        readMessagesQueueRef.current.add(message);

        if (!debounceUpdateRef.current) {
            debounceUpdateRef.current = debounce(() => {
                if (isQueueUpdatingRef.current) return;
                isQueueUpdatingRef.current = true;

                const queueMessages = Array.from(readMessagesQueueRef.current);
                readMessagesQueueRef.current.clear();

                if (queueMessages.length > 0) {
                    const newestMessage = queueMessages.reduce((latest, current) =>
                        new Date(current.created_at) > new Date(latest.created_at) ? current : latest,
                    );

                    const newLastReadAt = normalizeToSimpleFormat(newestMessage.created_at);

                    setChatRooms(prev =>
                        prev.map(cr => {
                            if (cr.id === chatRoom.id) {
                                const decrements = messagesRefs.current.filter(m => {
                                    return (new Date(m.created_at) > new Date(cr.last_read_at + ".000Z"))
                                        && (new Date(m.created_at) <= new Date(newestMessage.created_at))
                                        && m.user_id !== user.id;
                                });
                                const newUnreadCount = Math.max((cr.unread_count || 0) - decrements.length, 0);

                                return {
                                    ...cr,
                                    unread_count: newUnreadCount,
                                    last_read_at: newLastReadAt,
                                }
                            }
                            return cr;
                        })
                    );
                }
                isQueueUpdatingRef.current = false;
            }, 20);
        }

        debounceUpdateRef.current();
        addMessageToSchedule(message);
    }

    const [debouncedPendingSendQueue, setDebouncedPendingSendQueue] = useState([]);

    // Надсилаємо і відповідно, коли нам приходить з сервера інфа, що ми надіслали повідомлення
    const performSendMessage = async (messageData) => {
        try {
            ChatRoomMessage.sendMessage(messageData.message, chatRoom, chatRoomKey, messageData.attachments, progress => {
                setAllMessages(prev =>
                    prev.map(msg =>
                        msg.id === messageData.id ? { ...msg, uploadProgress: progress } : msg
                    )
                );
            }).then(async response => {
                const decryptedMessage = await ChatRoomMessage.decryptMessage(chatRoomKey, response.data);
                setLastMessage(decryptedMessage);
                setChatRooms(prev =>
                    prev.map(cr => {
                        if (cr.id === chatRoom.id) {
                            let isNewer = true;
                            if (cr.last_message) {
                                isNewer = new Date(decryptedMessage.created_at) > new Date(cr.last_message.created_at);
                            }
                            return {
                                ...cr,
                                last_message: isNewer ? decryptedMessage : cr.last_message,
                            };
                        }
                        return cr
                    })
                );
                setAllMessages(prev => {
                    const lastIndex = prev.length - 1;
                    if (prev[lastIndex]?.id === messageData.id) {
                        return [
                            ...prev.slice(0, lastIndex),
                            decryptedMessage
                        ];
                    } else {
                        return [
                            ...prev.filter(msg => msg.id !== messageData.id),
                            decryptedMessage,
                        ];
                    }
                });
            }).catch(error => {
                setLastMessage(messageData);
                setChatRooms(prev =>
                    prev.map(cr => {
                        if (cr.id === chatRoom.id) {
                            let isNewer = true;
                            if (cr.last_message) {
                                isNewer = new Date(messageData.created_at) > new Date(cr.last_message.created_at);
                            }
                            return {
                                ...cr,
                                last_message: isNewer ? messageData : cr.last_message,
                            };
                        }
                        return cr
                    })
                );
                setAllMessages(prev =>
                    prev.map((msg) =>
                        msg.id === messageData.id ? { ...msg, errorPending: error.message } : msg
                    )
                );
            }).finally(() => {
                setSendingMessage(false);
            });
        } catch (e) {
            if (e instanceof ProgressEvent) {
                setErrors({ ...errors, message: e.target.error.message });
            }
            setSendingMessage(false);
        }
    }

    const debouncedSendMessages = useRef(
        debounce(() => {
            debouncedPendingSendQueue.forEach(message => {
                performSendMessage(message);
            });
            setDebouncedPendingSendQueue([]);
        }, 300)
    ).current;

    // Створюємо плейсхолдер для надісланого повідомлення
    const sendMessage = async () => {
        setSendingMessage(true);
        setErrors({ ...errors, message: '' });

        const isVirtualizing = allMessagesRefs.current.length > VISIBLE_COUNT;
        const isLastMessageLoaded = allMessagesRefs.current.some(m => m.id === lastMessage?.id) || allMessagesRefs.current.length === 0;
        //console.log("SendingMessage:", {
        //    allMessages: allMessagesRefs.current,
        //    allMessagesHere: allMessages,
        //    chatRoomLastMessage: chatRoomRef.current.last_message,
        //    chatRoomLastMessageHere: chatRoom.last_message,
        //    lastMessageHere: lastMessage,
        //    isLastMessageLoaded,
        //});

        const tempId = crypto.randomUUID();
        const placeholderMessage = {
            id: tempId,
            message,
            user_id: user.id,
            user: {
                id: user.id,
                name: user.name,
                avatar: user.avatar,
            },
            attachments: messageAttachments,
            status: 'PENDING',
            created_at: new Date().toISOString(),
            isPlaceholder: true,
            errorPending: null,
            uploadProgress: 0,
        };

        setChatRooms(prev =>
            prev.map(cr => {
                if (cr.id === chatRoom.id) {
                    let isNewer = true;
                    if (cr.last_message) {
                        isNewer = new Date(placeholderMessage.created_at) > new Date(cr.last_message.created_at);
                    }
                    return {
                        ...cr,
                        last_message: isNewer ? placeholderMessage : cr.last_message,
                    };
                }
                return cr
            })
        );

        setAllMessages(prev => addUniqueMessages(prev, [placeholderMessage], false));
        setDebouncedPendingSendQueue(prevQueue => [...prevQueue, placeholderMessage]);
        debouncedSendMessages();

        setTimeout(() => {
            scrollToLastMessage(isVirtualizing, isLastMessageLoaded, !isLastMessageLoaded ? placeholderMessage : null);
        }, 0);

        setMessage('');
        setMessageAttachments([]);

        await performSendMessage(placeholderMessage);
    };

    const retrySendMessage = async (messageData) => {
        setAllMessages(prev =>
            prev.map(msg =>
                msg.id === messageData.id ? { ...msg, created_at: new Date().toISOString(), errorPending: null, uploadProgress: 0 } : msg
            )
        );
        setSendingMessage(true);

        await performSendMessage(messageData);
    }

    const anchorMessageIdRef = useRef(null);
    const anchorOffsetRef = useRef(0);



    useEffect(() => {
        if (anchorMessageIdRef.current && messagesRef.current && windowMessages.length > 0 && !shouldPreventShift) {
            const anchorId = anchorMessageIdRef.current;
            const globalIndex = allMessages.findIndex(m => m.id === anchorId);
            if (globalIndex !== -1 && messageRefs.current[globalIndex]) {
                const containerRect = messagesRef.current.getBoundingClientRect();
                const anchorRect = messageRefs.current[globalIndex].getBoundingClientRect();
                const currentOffset = anchorRect.top - containerRect.top;

                const diff = currentOffset - anchorOffsetRef.current;
                messagesRef.current.scrollTop = messagesRef.current.scrollTop + diff;
            }
        }
        anchorMessageIdRef.current = null;
        anchorOffsetRef.current = 0;

        setShouldPreventShift(false);
    }, [windowMessages]);

    const setAnchorMessage = (isScrollingUp) => {
        if (!messagesRef.current || windowMessages.length === 0) return;

        const containerRect = messagesRef.current.getBoundingClientRect();

        let fullyVisible = [];
        let partiallyVisible = [];

        for (let i = 0; i < windowMessages.length; i++) {
            const globalIndex = allMessages.findIndex(m => m.id === windowMessages[i].id);
            const el = messageRefs.current[globalIndex];
            if (!el) continue;
            const elRect = el.getBoundingClientRect();

            const fullyVis = elRect.top >= containerRect.top && elRect.bottom <= containerRect.bottom;
            const partlyVis = (elRect.bottom > containerRect.top && elRect.top < containerRect.bottom);

            if (fullyVis) {
                fullyVisible.push(i);
            } else if (partlyVis) {
                partiallyVisible.push(i);
            }
        }

        let anchorIndex = -1;
        if (fullyVisible.length > 0) {
            anchorIndex = isScrollingUp ? fullyVisible[0] : fullyVisible[fullyVisible.length - 1];
        } else if (partiallyVisible.length > 0) {
            anchorIndex = isScrollingUp ? partiallyVisible[0] : partiallyVisible[partiallyVisible.length - 1];
        } else {
            anchorIndex = isScrollingUp ? 0 : (windowMessages.length - 1);
        }


        const anchorMessage = windowMessages[anchorIndex];
        //console.log("Anchor Message:", { anchorMessage });
        const globalIndex = allMessages.findIndex(m => m.id === anchorMessage.id);
        //console.log("GlobalIndex:", globalIndex);
        const anchorEl = messageRefs.current[globalIndex];
        //console.log("Anchor element:", { anchorEl });
        if (!anchorEl) return;

        const anchorRect = anchorEl.getBoundingClientRect();
        anchorMessageIdRef.current = anchorMessage.id;
        anchorOffsetRef.current = anchorRect.top - containerRect.top;
    };


    const messagesScrollHandler = () => {
        if (messagesLoading && isLoadingMoreRef.current !== 0) {
            const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;

            lastKnownScrollTopRef.current = scrollTop;
            if (windowMessages.length > 0) {
                lastKnownAnchorMessageIdRef.current = windowMessages[0].id;
            }
            if (restoringState) return;

            const threshold = 50;
            const atTop = scrollTop <= threshold;
            const atBottom = scrollHeight - (scrollTop + clientHeight) <= threshold;

            if (atTop && scrollState !== 'upper') {
                setScrollState('upper');
                setAnchorMessage(true);
            } else if (atBottom && scrollState !== 'bottom') {
                setScrollState('bottom');
                setAnchorMessage(false);
            } else if (!atTop && !atBottom && scrollState !== 'middle') {
                setScrollState('middle');
            }
        }
        if (
            messagesLoading &&
            initialLoadingRef.current !== 2 ||
            cacheLoading ||
            isLoadingMoreRef.current !== 0 ||
            !hasMessages ||
            !messagesRef.current
        ) return;

        const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
        //console.log("MessagesRef:", { messagesRef });

        lastKnownScrollTopRef.current = scrollTop;
        if (windowMessages.length > 0) {
            lastKnownAnchorMessageIdRef.current = windowMessages[0].id;
        }
        //console.log("WindowMessages:", { windowMessages });

        if (restoringState) return;

        const threshold = 50;
        const atTop = scrollTop <= threshold;
        const atBottom = scrollHeight - (scrollTop + clientHeight) <= threshold;
        //console.log("Where am I?", {
        //    atTop,
        //    atBottom,
        //    scrollState: atTop ? "top" : atBottom ? "bottom" : "center",
        //    scrollTop,
        //    scrollHeight,
        //    clientHeight,
        //})

        const bufferSize = 20; // Airbag

        if (atTop && scrollState !== 'upper') {
            //console.log("We're going upper");
            setScrollState('upper');
            setAnchorMessage(true);

            if (windowStartIndex > 0) {
                setWindowStartIndex(prev => Math.max(0, prev - 10));
            }

            if (windowStartIndex <= bufferSize) {
                const startId = messages[0]?.id;
                if (startId) {
                    loadMore(true, 20, startId, true, false, false);
                }
            }
        } else if (atBottom && scrollState !== 'bottom') {
            //console.log("We're going lower");
            setScrollState('bottom');
            setAnchorMessage(false);

            const totalCount = allMessages.length;
            const remaining = totalCount - (windowStartIndex + VISIBLE_COUNT);

            if (remaining > 0) {
                setWindowStartIndex(prev => {
                    const shift = Math.min(remaining, 10);
                    return Math.min(prev + shift, Math.max(0, totalCount - VISIBLE_COUNT));
                });
            }

            if (remaining <= bufferSize) {
                const startId = messages[messages.length - 1]?.id
                if (startId && startId !== lastMessage?.id) {
                    loadMore(true, 20, startId, false, true);
                } else if (remaining > 0) {

                }
            }
        } else if (!atTop && !atBottom && scrollState !== 'middle') {
            setScrollState('middle');
        }
    };

    const pushMessage = (message) => {
        setMessagesOperation({
            type: messagesOperationTypes.push,
            message: message,
        });
    };

    const removeMessage = (message) => {
        setRemovingMessage(message);

        const messagesArray = messagesRefs.current;
        const messageId = messagesArray.findIndex(m => m.id === message.id);

        setTimeout(() => {
            (async () => {
                if (chatRoomRef.current.last_message?.id === message.id) {
                    const previousMessage = (messageId !== -1 && messagesArray.length > 1) ? messagesArray[messageId - 1] : null;
                    const newLastMessage = previousMessage
                        ? previousMessage
                        : await axios.get(route("chat_rooms.messages.get_last_message", { chatRoom: chatRoom })).then(res => res.data);

                    setChatRooms(prev =>
                        prev.map(cr => cr.id === chatRoomRef.current.id ? { ...cr, last_message: { ...newLastMessage } } : cr)
                    );
                }
            })();
            if (message.isPlaceholder && message.errorPending) {
                setAllMessages(prev => prev.filter(msg => msg.id !== message.id));
            } else {
                setMessagesOperation({
                    type: messagesOperationTypes.remove,
                    message: message,
                });
            }
        }, 600);
    };

    const availableToSendMessage = () => {
        return (message.trim().length || messageAttachments.length) && !sendingMessage && initialLoading === 2;
    };

    const saveMessageInputSelectionState = () => {
        setMessageSelectionStart(messageInputRef.current.selectionStart);
        setMessageSelectionEnd(messageInputRef.current.selectionEnd);
    };

    const handleKeyDown = (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            /*if (availableToSendMessage()) {
                sendMessage();
            }*/
            sendMessage();
        }

        saveMessageInputSelectionState();
    };

    const handleChange = (e) => {
        setMessage(e.target.value);
        saveMessageInputSelectionState();
    }

    const handleClick = (e) => {
        saveMessageInputSelectionState();
    };

    const insertEmoji = (emoji) => {
        const newMessage = message.slice(0, messageSelectionStart) + emoji + message.slice(messageSelectionEnd);
        const newSelectionPos = messageSelectionStart + emoji.length;

        setMessageSelectionStart(newSelectionPos);
        setMessageSelectionEnd(newSelectionPos);
        setMessage(newMessage);
    };

    useEffect(() => {
        const linesCount = message.split('\n').length - 1;

        if (linesCount < 10) {
            const style = messageInputRef.current.style;

            style.height = `${3.5 + linesCount}rem`;
        }
    }, [message]);

    useEffect(() => {
        if (initialLoading !== 2 && allMessages.length < 10) {
            requestAnimationFrame(() => {
                if (messagesRef.current) {
                    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
                }
            });
        }
    }, [initialLoading, allMessages]);

    useEffect(() => {
        lastKnownWindowStartIndexRef.current = windowStartIndex;
    }, [windowStartIndex]);

    const saveChatRoomState = () => {
        const messageId = lastKnownAnchorMessageIdRef.current;
        const state = {
            scrollTop: lastKnownScrollTopRef.current,
            messageId: messageId,
            //
        };
        /*console.log("Saving:", {
            state,
            message: allMessagesRefs.current.find(m => m.id === messageId)
        });*/
        setChatState(chatRoomRef.current.id, state);
    };

    useEffect(() => {
        const handleBeforeUnload = () => {
            saveChatRoomState();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            saveChatRoomState();
        };
    }, [chatRoom.id]);

    useLayoutEffect(() => {
        /*console.log("Restoring?:", {
            restoringState,
            chatRoomKey,
            allMessages,
        });*/
        if (restoringState === 1 && chatRoomKey && allMessages.length > 0 && messagesRef.current) {
            try {
                //console.log("Restoring:", {
                //    chatRoomId: chatRoom.id,
                //});
                const savedState = getChatState(chatRoom.id);
                //console.log("SavedState:", savedState);
                if (savedState) {
                    const { scrollTop, messageId } = savedState;
                    //console.log("Saved is:", {
                    //    scrollTop,
                    //    messageId,
                    //    allMessages,
                    //    check: allMessages.some(m => m.id === messageId),
                    //});
                    if (allMessages.some(m => m.id === messageId)) {
                        const currentIndex = allMessages.findIndex(m => m.id === messageId);
                        //console.log("CurrentIndex:", currentIndex);
                        if (chatRoom.unread_count > 0) {
                            const firstUnreadIndex = allMessages.findIndex(
                                m => new Date(m.created_at) > new Date(chatRoom.last_read_at + "Z")
                            );
                            const windowEndIndex = currentIndex + VISIBLE_COUNT + 1;
                            if (firstUnreadIndex !== -1 && windowEndIndex >= firstUnreadIndex) {

                                const newWindowStartIndex = currentIndex + 1;
                                const messageEl = messageRefs.current[currentIndex];
                                setWindowStartIndex(newWindowStartIndex);

                                requestAnimationFrame(() => {
                                    //console.log("Is there such a message?", messageEl);
                                    if (messageEl) {
                                        const messageHeight = messageEl.getBoundingClientRect().height;
                                        messagesRef.current.scrollTop = scrollTop - messageHeight;
                                    } else {
                                        messagesRef.current.scrollTop = scrollTop;
                                    }

                                    lastKnownAnchorMessageIdRef.current = messageId;
                                    lastKnownScrollTopRef.current = scrollTop;
                                    //console.log("Hello2", {
                                    //    messagesRefNewScrollTop: messagesRef.current.scrollTop,
                                    //});
                                });
                                setRestoringState(0);
                                return;
                            }
                        }
                        setWindowStartIndex(currentIndex);

                        requestAnimationFrame(() => {
                            //console.log("Lucky!");
                            if (messagesRef.current) {
                                //console.log("They are here:", {
                                //    currentScrollTop: messagesRef.current.scrollTop,
                                //    newScrollTop: scrollTop,
                                //});
                                messagesRef.current.scrollTop = scrollTop;
                                lastKnownAnchorMessageIdRef.current = messageId;
                                lastKnownScrollTopRef.current = scrollTop;
                                //console.log("Hello:", {
                                //    messagesRefNewScrollTop: messagesRef.current.scrollTop,
                                //});
                            }
                        });
                    } else {
                        //console.log("Not today:", {
                        //    scrollTop: scrollTop,
                        //    messageId: messageId,
                        //});
                        removeChatState(chatRoom.id);
                        requestAnimationFrame(() => {
                            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
                        });
                    }
                } else {
                    //console.log("Not today:", {
                    //    savedState,
                    //});
                    removeChatState(chatRoom.id);
                    requestAnimationFrame(() => {
                        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
                    });
                }
                setRestoringState(0);
            } catch (error) {
                //console.error("Error while restoring state");
                setRestoringState(0);
                requestAnimationFrame(() => {
                    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
                });
            }
        }
    }, [restoringState, chatRoomKey, allMessages]);

    const computedMessages = useMemo(() => {
        let processedMessages = [];

        allMessages.forEach((message, i, array) => {
            const prevMessage = i > 0 ? array[i - 1] : null;
            const nextMessage = i < array.length - 1 ? array[i + 1] : null;

            const messageDate = new Date(message.created_at);

            const messageDateStr = messageDate.toDateString();
            const prevMessageDateStr = prevMessage ? (new Date(prevMessage.created_at)).toDateString() : null;

            const isStartOfGroup = !prevMessage || prevMessage.user_id !== message.user_id ||
                (messageDate - new Date(prevMessage.created_at)) > 5 * 60 * 1000;

            const isEndOfGroup = !nextMessage || nextMessage.user_id !== message.user_id ||
                (new Date(nextMessage.created_at) - messageDate) > 5 * 60 * 1000;

            let messageType;
            if (isStartOfGroup && isEndOfGroup) {
                messageType = 'singular';
            } else if (isStartOfGroup) {
                messageType = 'top';
            } else if (isEndOfGroup) {
                messageType = 'last';
            } else {
                messageType = 'middle';
            }

            let gap = '';
            if (i > 0) {
                gap = messageType === 'singular' ? 'mt-1 mb-1'
                    : messageType === 'top' ? 'mt-1'
                        : messageType === 'last' ? 'mb-1' : '';
            }

            processedMessages.push({
                ...message,
                messageType,
                gap,
                showDate: messageDateStr !== prevMessageDateStr ? messageDate : null,
            })
        })
        let outputElements = [];
        if (initialLoading !== 2 && allMessages.length < 20) {
            outputElements.push(
                ...[...Array(2)].map((_, index) => (
                    <div key={`skeleton-left-${index}`}
                        className="first:mt-auto flex items-end max-w-xl self-start animate-pulse space-x-3 group ml-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                        <div className="flex-1 space-y-4 py-1 w-40">
                            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-300 rounded w-full"></div>
                        </div>
                    </div>
                )),
                [...Array(4)].map((_, index) => (
                    <div key={`skeleton-right-${index}`}
                        className="first:mt-auto flex items-end max-w-xl self-end animate-pulse space-x-3 group mr-3">
                        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                        <div className="flex-1 space-y-4 py-1 w-40">
                            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-300 rounded w-full"></div>
                        </div>
                    </div>
                )),
                [...Array(3)].map((_, index) => (
                    <div key={`skeleton-left-${index}`}
                        className="first:mt-auto flex items-end max-w-xl self-start animate-pulse space-x-3 group ml-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                        <div className="flex-1 space-y-4 py-1 w-40">
                            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-300 rounded w-full"></div>
                        </div>
                    </div>
                )),
                [...Array(2)].map((_, index) => (
                    <div key={`skeleton-right-${index}`}
                        className="first:mt-auto flex items-end max-w-xl self-end animate-pulse space-x-3 group mr-3">
                        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                        <div className="flex-1 space-y-4 py-1 w-40">
                            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-300 rounded w-full"></div>
                        </div>
                    </div>
                )),
            );
        }

        windowMessages.forEach((message, i) => {
            const processedMessage = processedMessages.find(m => m.id === message.id);
            if (!processedMessage) return;

            if (processedMessage.showDate) {
                const now = new Date();
                const messageDate = processedMessage.showDate;
                const isSameYear = messageDate.getFullYear() === now.getFullYear();

                let dateFormatOptions = { month: 'long', day: 'numeric' };
                if (!isSameYear) {
                    dateFormatOptions.year = 'numeric';
                }

                const dateLabel = messageDate.toLocaleDateString(undefined, dateFormatOptions);
                outputElements.push(
                    <div key={`date-${dateLabel}`} className="mt-1 mb-1 text-center select-none">
                        <div className="inline-block px-3 rounded-full bg-gray-200 opacity-75 cursor-pointer">
                            <span className="text-sm">{dateLabel}</span>
                        </div>
                    </div>
                );
            }

            outputElements.push(
                <ChatMessage
                    key={`${processedMessage.id}`}
                    className={`${processedMessage.gap} ${(removingMessage && removingMessage.id === processedMessage.id)
                        ? 'transition-opacity opacity-30 duration-500 ease-in ' : ''}`}
                    ref={(el) => setMessageRef(el, allMessages.findIndex(m => m.id === processedMessage.id))}
                    self={user.id === processedMessage.user_id}
                    message={processedMessage}
                    messageType={processedMessage.messageType}
                    onMessageRead={onMessageRead}
                    onMessageRemoved={() => removeMessage(processedMessage)}
                    isPlaceholder={processedMessage.isPlaceholder}
                    errorPending={processedMessage.errorPending}
                    uploadProgress={processedMessage.uploadProgress}
                    onRetrySend={() => retrySendMessage(processedMessage)}
                    chatRoom={chatRoom}
                />
            );
        });
        return outputElements;
    }, [windowMessages, initialLoading, restoringState, allMessages]);

    return (
        <ChatRoomContextProvider value={{ chatRoom, chatRoomKey }}>
            <div className={``}>
                <div
                    className={`
                        h-[calc(100dvh-15rem)] sm:h-[calc(100dvh-19rem)]
                        overflow-y-auto
                        flex flex-col py-3 ${restoringState ? 'hidden md:block' : ''}
                    `}
                    ref={messagesRef}
                    onScroll={messagesScrollHandler}
                >
                    {computedMessages}
                </div>

                <div className={`pt-2 px-3 bg-gray-200`}>
                    <div className="flex gap-4">
                        <div className={`w-full`}>
                            <TextArea
                                className="w-full h-14"
                                ref={messageInputRef}
                                value={message}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                onClick={handleClick}
                                placeholder="Message"
                            />
                        </div>

                        <div className={`self-end mb-2`}>
                            <div className={`text-xs text-center text-gray-500`}>Ctrl+Enter</div>

                            <PrimaryButton
                                onClick={() => sendMessage()}
                            //disabled={!availableToSendMessage()}
                            >Send</PrimaryButton>
                        </div>
                    </div>

                    <div className={`flex gap-3 justify-center pb-2`}>
                        <Emojis onSmileSelected={insertEmoji} />

                        <SelectAttachments
                            selectedFiles={messageAttachments}
                            setSelectedFiles={setMessageAttachments}
                        />

                        <AutoDeleteSettings />
                        <RecordAudioMessage
                            selectedFiles={messageAttachments}
                            setSelectedFiles={setMessageAttachments}
                        />
                    </div>
                </div>
            </div>
        </ChatRoomContextProvider>
    );
}
