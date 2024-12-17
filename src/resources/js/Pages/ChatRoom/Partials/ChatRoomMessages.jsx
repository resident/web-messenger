import ChatMessage from "@/Pages/ChatRoom/Partials/ChatMessage.jsx";
import TextArea from "@/Components/TextArea.jsx";
import PrimaryButton from "@/Components/PrimaryButton.jsx";
import SelectAttachments from "@/Pages/ChatRoom/Partials/SelectAttachments.jsx";
import AutoDeleteSettings from "@/Pages/ChatRoom/Partials/AutoDeleteSettings.jsx";
import { ChatRoomContextProvider } from "@/Pages/ChatRoom/ChatRoomContext.jsx";
import { cache, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";
import Emojis from "@/Components/Emojis.jsx";
import ChatRoom from "@/Common/ChatRoom.js";
import ChatRoomMessage from "@/Common/ChatRoomMessage.js";
import RecordAudioMessage from "./RecordAudioMessage";
import axios, { all } from "axios";
import Utils from "@/Common/Utils.js";

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

    //const [unreadMessageIds, setUnreadMessageIds] = useState(new Set());

    const [cacheLoading, setCacheLoading] = useState(true);

    // 0 - базова
    // 1 - Початок процесу завантаження повідомлень
    // 2 - Кінець процесу завантаження повідомлень
    const [initialLoading, setInitialLoading] = useState(0);

    const [lastMessage, setLastMessage] = useState(props.chatRoom.last_message);

    const [shouldScroll, setShouldScroll] = useState(false);

    const messagesRef = useRef();
    //const skeletonRef = useRef();
    const messageRefs = useRef([]);
    const messageInputRef = useRef();

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
        const allMessagesLengthBefore = allMessagesRefs.current.length;
        allMessagesRefs.current = allMessages;

        if (allMessagesRefs.current.length - allMessagesLengthBefore === 1) {
            if (!lastKnownWindowStartIndexRef.current && !allMessagesRefs.current) return;

            const wasAtBottom = (lastKnownWindowStartIndexRef.current + VISIBLE_COUNT >= allMessagesRefs.current.length);
            const { scrollTop, scrollHeight, clientHeight } = messagesRef.current || {};
            const isNearBottom = scrollHeight - (scrollTop + clientHeight) <= 300;

            //console.log("")
            //console.log("IsNearBottom?", isNearBottom);
            //console.log("WasAtBottom?", wasAtBottom);
            if (wasAtBottom) {
                //if (!isNearBottom) {
                //    setShouldPreventScroll(true);
                //}
                setWindowStartIndex(prev => {
                    const newIndex = Math.max(0, allMessagesRefs.current.length - VISIBLE_COUNT);
                    //console.log("Adjusting windowStartIndex after new message at bottom:", {
                    //    prevWindowStartIndex: prev,
                    //    newIndex,
                    //    allMessagesLength: allMessagesRefs.current.length
                    //});
                    return newIndex;
                });
                if (isNearBottom) {
                    setTimeout(() => {
                        setShouldScroll(true);
                        setScrollTo(scrollToDirection.bottom);
                    }, 0);
                }


            }
        }

    }, [allMessages]);

    const addUniqueMessages = (currentMessages, newMessages, isUpper) => {
        const uniqueMessages = newMessages.filter(
            message => !currentMessages.some(existingMessage => existingMessage.id === message.id)
        );
        return isUpper ? [...uniqueMessages, ...currentMessages] : [...currentMessages, ...uniqueMessages];
    };
    /*
    const removeMessageAdv = (currentMessages, messageToRemove) => {
        (async () => {
            const filteredMessages = currentMessages.filter(
                message => {
                    // Отримуємо два останні повідомлення
                    const check = messagesRefs.current?.length > 1 && (chatRoomRef.current.last_message?.id === messagesRefs.current[messagesRefs.current.length - 1]);
                    const lastMessages = check
                        ? [messagesRefs.current[messagesRefs.current - 2], chatRoomRef.current.last_message]
                        : await axios.get(route("chat_rooms.messages.index", { chatRoom: chatRoom.id, count: 2, startId: 0, upperload: true, lowerload: false, lastMessage: true })).then(res => res.data);

                    if (lastMess?.id === messageToRemove.id && messagesRefs.current.length > 0) {
                        // Fully loaded
                        if (lastMess?.id === messagesRefs.current[messagesRefs.current.length - 1]) {

                        }
                    }
                }
            )
            if (chatRoomRef.current.last_message?.id)
        })();
    }*/

    const [windowStartIndex, setWindowStartIndex] = useState(0);
    const VISIBLE_COUNT = 50;
    const [pendingShift, setPendingShift] = useState(null);

    const STORAGE_KEY = `chat_room_state${chatRoom.id}`;
    const [restoringState, setRestoringState] = useState(0);
    const lastKnownScrollTopRef = useRef(0);
    const lastKnownWindowStartIndexRef = useRef(windowStartIndex);
    const lastKnownAnchorMessageIdRef = useRef(null);

    const [shouldPreventScroll, setShouldPreventScroll] = useState(false);


    useEffect(() => {
        const freshChatRoom = chatRooms.find(chat => chat.id === chatRoom.id);
        if (freshChatRoom) {
            setChatRoom(freshChatRoom);
        }
    });

    useEffect(() => {
        setLastMessage(chatRoom.last_message);
    }, [chatRoom.last_message]);

    useEffect(() => {
        setActiveChatRoom(chatRoom);

        return () => {
            setActiveChatRoom(null);
        };
    }, [chatRoom]);

    // 1 - Встановлюємо ключ
    useEffect(() => {
        if (userPrivateKey) {
            const chatRoomKeyEnc = chatRoom.users.find(u => u.id === user.id).pivot.chat_room_key;

            ChatRoom.decryptChatRoomKey(userPrivateKey, chatRoomKeyEnc).then(chatRoomKey => {
                setChatRoomKey(chatRoomKey);
            });
        } else {
            setChatRoomKey(null);
        }
    }, [chatRoom]);

    // 2 - Завантаження чату, додаються повідомлення, які вже є у chatRooms.chatRoom.messages
    useEffect(() => {
        if (chatRoomKey) {
            if (initialLoading === 0 && chatRoom) {
                // Як і в телеграмі, якщо до нас не прийшли повідомлення (у випадку коли або взагалі їх немає, або коли початково завантажених (ChatRoomsController->list) unread_count там > 10)
                // Тоді завантажуємо просто 20 повідомлень, з сервера прийде до 10 нових і до 10 старих, разом максимум 20

                if (chatRoom.messages.length === 0) {
                    //console.log("There are no messages");
                    setCacheLoading(false);
                    loadMessages(20);
                } else {
                    //console.log("There are some messages");
                    setMessages([...chatRoom.messages]);
                }
            }
        }
    }, [chatRoomKey]);

    const isLoadingMoreRef = useRef(0);

    // Викликається для завантаження вгору і вниз, як мануально, так і автоматично (розрахунок кількості повідомлень на завантаження)
    const loadMore = (manual = false, count = 0, startId = 0, upperLoad = false, lowerLoad = false) => {
        //console.log("ADDITIONAL LOADING - 1");

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
                setRestoringState(1);
                isLoadingMoreRef.current = 0;
                return;
            }

            const unreadCount = messages.filter(
                m => new Date(m.created_at) > new Date(chatRoom.last_read_at)
            ).length;
            const n = Math.min(unreadCount, 10);
            const messagesToLoad = 20 - n;

            //console.log("ADDITIONAL LOADING - 3");
            startId = messages[0]?.id;
            //console.log("Starting id:", {
            //    startId: startId,
            //    message: messages[0],
            //});
            //setTopMessageIdBeforeLoad(startId);
            setPendingShift({ direction: upperLoad ? "up" : "down", prevCount: allMessages.length });
            isLoadingMoreRef.current = 1;
            loadMessages(messagesToLoad, startId, upperLoad, lowerLoad);

            //console.log("ADDITIONAL LOADING - 4");
        }
    };

    // 3- Довантажуємо повідомлення (в залежності від того, які прийшли до нас на початку)
    // Викликається або (1) на початку, або (2) коли відбувся скрол вниз і там розрив повідомлень (не факт, вже не пам'ятаю)
    useEffect(() => {
        if (!cacheLoading) return;
        if (messages.length <= 0) return;
        // У випадку наявних повідомлень, робимо перевірку, обов'язково має бути мінімум 10 повідомлень прочитаних
        // Робимо перевірку на таку кількість, якщо їх менше, то довантажуємо "вгору", щоб добити відповідну кількість
        // При тому враховується, що максимальна непрочитана кількість повідомлень, яка може сюди прийти (з chatRooms) становить 10
        // Таким чином, рахуємо кількість непрочитаних n, потім 20 - n і отримуємо кількість, що треба завантажити вгору
        //console.log("ADDITIONAL LOADING");
        setCacheLoading(false);
        loadMore(false, 0, 0, true, false);
    }, [messages]);

    // Спрацьовує, коли ми довантажуємо (самі) повідомлення вгору/вниз
    useEffect(() => {
        if (isLoadingMoreRef.current === 2) {
            isLoadingMoreRef.current = 0;

            const shift = 10;
            const loaded = allMessages.length - pendingShift.prevCount;

            if (pendingShift && pendingShift.direction === "up") {
                if (allMessages.length > VISIBLE_COUNT) {
                    //console.log("Shifting loading upwards:", {
                    //    windowStartIndex
                    //});
                    if (windowStartIndex > shift) {
                        //console.log("This happens 0");
                        setWindowStartIndex(prev => Math.max(0, prev - shift + (loaded >= shift ? loaded : 0)));

                    } else {
                        //console.log("This happens 1");
                        setWindowStartIndex(prev => Math.min(prev + loaded, prev + shift));
                        /*
                        console.log("Deciding:", {
                            prevCount: pendingShift.prevCount,
                            VISIBLE_COUNT,
                            allMessagesLength: allMessages.length,
                            check1: pendingShift.prevCount < VISIBLE_COUNT,
                            check2: allMessages.length > VISIBLE_COUNT,
                        })
                        if (pendingShift.prevCount < VISIBLE_COUNT && allMessages.length > VISIBLE_COUNT) {
                            const excess = allMessages.length - VISIBLE_COUNT;
                            console.log("Handling first buffer crossing:", { excess });
                            setWindowStartIndex(excess);
                        } else {
                            setWindowStartIndex(prev => prev + loaded);
                        }*/
                    }
                }
                setPendingShift(null);
            } else if (pendingShift && pendingShift.direction === "down") {
                if (allMessages.length > VISIBLE_COUNT) {
                    if (windowStartIndex + VISIBLE_COUNT >= (allMessages.length - loaded)) {
                        //console.log("This happens 2");
                        setWindowStartIndex(prev => Math.min(prev + shift, allMessages.length - VISIBLE_COUNT));
                    } else {
                        //console.log("This happens 3");
                    }
                }
                setPendingShift(null);
            }
        }
    }, [allMessages, pendingShift]);

    // N - при зміні messages чи pendingMessages автоматично змінювати весь список повідомлень для відображення
    useEffect(() => {
        const combinedMessages = [...messages, ...pendingMessages].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        setAllMessages(combinedMessages);
    }, [messages, pendingMessages]);

    // Virtualization
    const windowMessages = useMemo(() => {
        let start = windowStartIndex;
        if (start < 0) start = 0;
        let end = start + VISIBLE_COUNT;
        if (end > allMessages.length) end = allMessages.length;
        //console.log("Changing shifting here");
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

        if (windowMessages.length > 0) {
            setHasMessages(true);
            if (shouldScroll && scrollTo === 'bottom') {
                const windowIndex = windowMessages.length - 1;
                const globalIndex = allMessages.findIndex(m => m.id === windowMessages[windowIndex].id);
                //console.log("Scrolling to bottom message:", {
                //    windowIndex,
                //    windowM: windowMessages[windowIndex],
                //    allMessages,
                //    globalIndex,
                //});
                scrollToMessage(globalIndex);
            } else if (shouldScroll && scrollTo === 'top') {
                const windowIndex = windowMessages.length - prevMessagesLength;
                const globalIndex = allMessages.findIndex(m => m.id === windowMessages[windowIndex].id);
                scrollToMessage(globalIndex);
            }
            setShouldScroll(false);
        } else {
            setHasMessages(false);
        }
    }, [allMessages, windowMessages]);

    // 3 - Підключаємось до каналу
    useEffect(() => {
        const channelName = `chat-room.${chatRoom.id}`;
        const channel = Echo.private(channelName);

        if (chatRoomKey) {
            channel
                .listen('ChatRoomMessageSent', onChatRoomMessageSent) // у випадку активності чата (тобто цей чат відкритий) контроль над ChatRoomMessageSent перехватується цим компонентом
                .listen('ChatRoomMessageRemoved', onChatRoomMessageRemoved) // так само
                .listen('ChatRoomUpdated', onChatRoomUpdated)
                .listen('ChatRoomMessageStatusUpdated', onChatRoomMessageStatusUpdated);
        } else {
            setMessages([]);
        }

        return () => {
            channel
                .stopListening('ChatRoomMessageSent')
                .stopListening('ChatRoomMessageRemoved')
                .stopListening('ChatRoomUpdated')
                .stopListening('ChatRoomMessageStatusUpdated');
        };
    }, [chatRoomKey]);

    // 4 - Завантажуємо нові повідомлення, для будь-яких випадків, 
    // початкове завантаження (!upperload && !lowerload), 
    // завантаження вгору (upperload), завантаження вниз (lowerload)
    const loadMessages = (count = null, startId = null, upperload = false, lowerload = false) => {
        if (messagesLoading) return;
        setMessagesLoading(true);
        setPrevMessagesLength(allMessages.length);

        axios.get(route('chat_rooms.messages.index', { chatRoom: chatRoom.id, count, startId, upperload, lowerload, lastMessage: false }))
            .then(async (response) => {
                const loadedMessages = [];

                for (const message of response.data) {
                    const decryptedMessage = await ChatRoomMessage.decryptMessage(chatRoomKey, message);
                    loadedMessages.push(decryptedMessage);
                }
                //console.log("loaded messages: ", loadedMessages);
                if (initialLoading === 0) {
                    //console.log("ADDITIONAL LOADING - 2");
                    setInitialLoading(1);
                }
                if (isLoadingMoreRef.current === 1) {
                    isLoadingMoreRef.current = 2;
                }

                if (upperload) {
                    // Record current scroll position and container height before loading
                    //console.log("Upper loading");
                    //let oldScrollTop = 0;
                    //let oldScrollHeight = 0;
                    //if (messagesRef.current) {
                    //    oldScrollTop = messagesRef.current.scrollTop;
                    //    oldScrollHeight = messagesRef.current.scrollHeight;
                    //}
                    //console.log("OldScroll:", {
                    //    oldScrollTop: oldScrollTop,
                    //    oldScrollHeight: oldScrollHeight,
                    //});
                    /*
                    setMessages(prev => {
                        const newMessage = [...loadedMessages, ...prev];
                        if (newMessage.length < 50) {
                            requestAnimationFrame(() => {
                                setTimeout(() => {
                                    console.log("MessagesRef current?", messagesRef.current);
                                    if (messagesRef.current) {
                                        const newScrollHeight = messagesRef.current.scrollHeight;
                                        const heightDiff = newScrollHeight - oldScrollHeight;
                                        messagesRef.current.scrollTop = oldScrollTop + heightDiff;
                                        console.log("New stuff:", {
                                            newScrollHeight: newScrollHeight,
                                            heightDiff: heightDiff,
                                            MCscrollTop: messagesRef.current.scrollTop,
                                        });
                                    }
                                }, 100);
                            });
                        } 

                        return [...loadedMessages, ...prev];
                    });*/
                    setMessages(prev => addUniqueMessages(prev, loadedMessages, true));
                } else if (lowerload) {
                    setMessages(prev => addUniqueMessages(prev, loadedMessages, false));
                } else {
                    setMessages(() => loadedMessages);
                }
            })
            .finally(() => {
                setMessagesLoading(false);
            });
    };

    // 5 - Тільки у випадку завантаження початкового, коли є непрочитані повідомлення, скролиться до них
    useEffect(() => {
        if (initialLoading !== 1) return;
        //if (initialLoading === 2 && allMessages.length === 0) return;
        //if (initialLoading ===) return;

        //console.log(`InitialLoading: ${initialLoading}`);

        let firstUnreadId = -1;
        //console.log("First unread id:" + firstUnreadId);
        if (chatRoom.last_read_at) {
            //console.log(chatRoom.last_read_at);
            const lastReadAtUTC = new Date(chatRoom.last_read_at + 'Z');

            //console.log(messages);
            firstUnreadId = messages.findIndex(
                m => new Date(m.created_at) >= lastReadAtUTC
            );
            //console.log("First unread id-2: " + firstUnreadId);
        } else {
            firstUnreadId = messages.length - 1;
            //console.log("First unread id-3: " + firstUnreadId);
        }
        //console.log("First unread id-4: " + firstUnreadId);

        const targetIndex = firstUnreadId >= 0 ? firstUnreadId : (messages.length - 1);

        const globalIndex = messages[targetIndex] ? allMessages.findIndex(m => m.id === messages[targetIndex].id) : -1;
        if (globalIndex >= 0) {
            scrollToMessage(globalIndex);
        } else {
            //if (messages.length >= 1) {
            //    console.log(`Going to ${messages.length - 1}`);
            //    scrollToMessage(messages.length - 1);
            //}
        }

        setTimeout(() => {
            setInitialLoading(2);
            //setRestoringState(1);
        }, 0);
    }, [allMessages]);

    const setMessageRef = (el, index) => {
        messageRefs.current[index] = el;
    };

    const scrollToMessage = (global) => {
        // Індекси приходять в залежності від саме всього, шукається у allMessages
        setTimeout(() => {
            const el = messageRefs.current[global];
            //console.log("Scrolling to message:", {
            //    global,
            //    el,
            //    messagesRef: messageRefs.current,
            //});
            if (el) {
                el.scrollIntoView({
                    behavior: 'instant',
                    block: 'start',
                });
            }
        }, 20);
        setScrollTo(null);
    };

    // Викликається у двох випадках:
    // 1 - якщо людина надсилає своє повідомлення, її одразу перекидує в самий низ
    // 2 - якщо людина натискає на кнопку вниз (ще треба доробити її)
    const scrollToLastMessage = (wasAtBottom, diff, isVirtualizing) => {
        setChatRooms(prev =>
            prev.map(cr => cr.id === chatRoom.id ? { ...cr, unread_count: 0 } : cr)
        );
        const lastMessageAll = allMessages[allMessages.length - 1];
        const isSameLastMessage = lastMessageAll && lastMessage?.id === lastMessageAll.id;


        // Якщо є gap, стираються всі з allMessages, додається lastMessage в messages, завантажуємо зверху повідомлення (cacheLoading)
        if (!isSameLastMessage && lastMessage) {
            setAllMessages([]);
            setInitialLoading(0);
            setCacheLoading(true);
            setMessages([lastMessage]);
        } else {
            if (isVirtualizing) {
                if (wasAtBottom) {
                    if (allMessagesRefs.current?.length >= 50) {
                        // У випадку, коли прогружені останні 50 повідомлень, при тому існує віртуалізація (тобто кількість загальна повідомлень більша ніж 50 видимих)
                        setWindowStartIndex(prev => {
                            //console.log("Adjusting windowStartIndex after new message at bottom:", {
                            //    prevWindowStartIndex: prev,
                            //    incrementBy: 1
                            //});
                            return prev + 1;
                        });
                    }
                } else {
                    // У випадку коли не були прогружені останні 50 повідомлень, тоді ми їх рухаємось туди
                    setWindowStartIndex(prev => {
                        //console.log("Adjusting windowStartIndex after new message at bottom:", {
                        //    prevWindowStartIndex: prev,
                        //    incrementBy: 1
                        //});
                        return Math.max(0, allMessages.length - VISIBLE_COUNT) + 1;
                    });
                }
            } else {
                //
            }
        }
        setShouldScroll(true);
        setScrollTo(scrollToDirection.bottom);
    }

    useEffect(() => {
        if (messagesOperation) {

            switch (messagesOperation.type) {
                case messagesOperationTypes.push: {
                    setMessages(prev => addUniqueMessages(prev, [messagesOperation.message], false));
                    break;
                }

                case messagesOperationTypes.remove: {
                    //setMessages(prev => removeMessageAdv(prev, messagesOperation.message));
                    setMessages(prev => prev.filter(m => m.id !== messagesOperation.message.id));
                    break;
                }
            }

            setMessagesOperation(null);
        }

    }, [messages, messagesOperation]);


    const onChatRoomMessageSent = (e) => {
        (async () => {
            const dMessage = await ChatRoomMessage.decryptMessage(chatRoomKey, e.message);

            const wasAtBottom = (lastKnownWindowStartIndexRef.current + VISIBLE_COUNT >= allMessagesRefs.current.length);
            //console.log("wasAtBottom (Sent)?:", {
            //    windowStartIndexVC: lastKnownWindowStartIndexRef.current + VISIBLE_COUNT,
            //    allMessagesLength: allMessagesRefs.current.length,
            //    wasAtBottom,
            //});

            //pushMessage(dMessage);

            const lastMessageAll = allMessagesRefs.current[allMessagesRefs.current.length - 1];
            const isSameLastMessage = lastMessageAll && chatRoomRef.current.last_message?.id === lastMessageAll.id;
            //console.log("LastMessage:", {
            //    lastMessageAll,
            //    lastMessage: chatRoomRef.current.last_message,
            //    isSameLastMessage,
            //);

            const { scrollTop, scrollHeight, clientHeight } = messagesRef.current || {};
            const isNearBottom = scrollHeight - (scrollTop + clientHeight) <= 200;

            //console.log("isNearBottom (Sent)?:", {
            //    scrollHeight,
            //    scrollTop,
            //    clientHeight,
            //    isNearBottom,
            //});

            //console.log("onChatRoomMessageSent checking:", {
            //    wasAtBottom,
            //    isNearBottom,
            //});

            if (isSameLastMessage) {
                setChatRooms(prev =>
                    prev.map(cr => {
                        if (cr.id === chatRoomRef.current.id) {
                            const isUserMessage = dMessage.user_id === user.id;

                            // У випадку, якщо ми біля низу і тоді автоматично прочитується повідомлення, last_read_at можна не записувати, оскільки це буде відповідати observer і onMessageRead
                            // Не додається нічого до unread_count, оновлюється останнє повідомлення
                            if (isNearBottom && wasAtBottom) { // Доробити для онлайн режиму
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
                                    last_message: dMessage,
                                }
                            }
                        }
                        return cr;
                    })
                );
                pushMessage(dMessage);

                //console.log("IsNearBottom?", isNearBottom);
                // Не дає shift зробити автоматичний скролл

                if (wasAtBottom) {
                    if (!isNearBottom) {
                        setShouldPreventScroll(true);
                    }
                }
                /*
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            setWindowStartIndex(prev => {
                                const newIndex = Math.max(0, allMessagesRefs.current.length - VISIBLE_COUNT);
                                console.log("Adjusting windowStartIndex after new message at bottom:", {
                                    prevWindowStartIndex: prev,
                                    newIndex,
                                    allMessagesLength: allMessagesRefs.current.length
                                });
                                return newIndex;
                            });
                        }, 100);
                    });

                    if (isNearBottom) {
                        requestAnimationFrame(() => {
                            setTimeout(() => {
                                setShouldScroll(true);
                                setScrollTo(scrollToDirection.bottom);
                            }, 100);
                        });
                    }
                }
            } else {
                // В цьому випадку, якщо існує певний gap між завантаженими повідомленнями і останнім (тобто наприклад не завантажили ще 20 повідомлень з сервера)
                // Тоді просто змінюємо last_message, додаємо unread_count, без pushMessage
                setChatRooms(prev =>
                    prev.map(cr => {
                        if (cr.id === chatRoomRef.current.id) {
                            const isUserMessage = dMessage.user_id === user.id;
                            const newUnreadCount = isUserMessage ? 0 : (cr.unread_count || 0) + 1;

                            return {
                                ...cr,
                                unread_count: newUnreadCount,
                                last_read_at: isUserMessage ? dMessage.created_at : cr.last_read_at,
                                last_message: dMessage,
                            }
                        }
                        return cr;
                    })
                );*/
            }

            const notif = !isNearBottom && !userIsOnlineRef.current && !chatRoomRef.current.muted && dMessage.user_id !== user.id;
            //console.log("Show notification (Sent)?:", {
            //    isNearBottom,
            //    userIsOnline: userIsOnlineRef.current,
            //    chatRoomMuted: chatRoomRef.current.muted,
            //    dMessageUID: dMessage.user_id,
            //   userId: user.id,
            //    notif,
            //});
            if (notif) {
                Utils.showNotification(`${chatRoomRef.title}`, {
                    body: `${dMessage.user.name}: ${dMessage.message}`,
                    tag: `${chatRoomRef.title}`,
                    renotify: true,
                });
            }
        })();
    };

    const onChatRoomMessageRemoved = (e) => {
        (async () => {
            const messageToRemove = e.message;

            const messagesArray = messagesRefs.current;
            const messageId = messagesArray.findIndex(m => m.id === messageToRemove.id);

            //console.log("Start remove:", {
            //    messagesArray,
            //    messageId,
            //    messageToRemove,
            //    lastMessage: chatRoomRef.current.last_message,
            //});

            if (chatRoomRef.current.last_message?.id === messageToRemove.id) {
                const previousMessage = messageId !== -1 ? messagesArray[messageId - 1] : null;
                const newLastMessage = previousMessage
                    ? previousMessage
                    : await axios.get(route("chat_rooms.messages.get_last_message", { chatRoom: chatRoom.id })).then(res => res.data);

                //console.log("Data:", {
                //    previousMessage,
                //    newLastMessage,
                //})

                setChatRooms(prev =>
                    prev.map(cr => cr.id === chatRoomRef.current.id ? { ...cr, last_message: newLastMessage } : cr)
                );
            }

            const check = new Date(messageToRemove.createdAt) > new Date(chatRoomRef.current.last_read_at + "Z") && messageToRemove.user_id !== user.id;
            //console.log("Will remove?:", {
            //    messageToRemove,
            //    lastReadAt: chatRoomRef.current.last_read_at,
            //    messageToRemoveDate: new Date(messageToRemove.createdAt),
            //    lastReadAtDate: new Date(chatRoomRef.current.last_read_at + "Z"),
            //    check,
            //});
            if (check) {
                setChatRooms(prev =>
                    prev.map(cr => {
                        if (cr.id === chatRoomRef.current.id) {
                            const newUnreadCount = Math.max((chatRoomRef.current.unread_count || 0) - 1, 0);
                            //console.log("Removing:", {
                            //    unreadCount: chatRoomRef.current.unread_count,
                            //    newUnreadCount,
                            //});
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

        setMessages(prev => prev.map(
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


    ///



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

            //console.log("Debounce triggered: Determining newest message", { scheduledMessages });

            const newestMessage = scheduledMessages.reduce((latest, current) =>
                new Date(current.created_at) > new Date(latest.created_at) ? current : latest,
            );
            const lastReadAtTime = normalizeToSimpleFormat(newestMessage.created_at);

            //console.log("Posting new last_read_at to server", {
            //    chatRoomId: chatRoom.id,
            //    message: newestMessage.message,
            //    messageTime: newestMessage.created_at,
            //    LastReadAt: lastReadAtTime,
            //});
            /*scheduleLastReadAtMessagesRef.current = new Set(Array.from(scheduleLastReadAtMessagesRef.current).filter(
                m => new Date(m.created_at) > new Date(lastReadAtTime + "Z")
            ));
            console.log("Remaining messages in scheduleLastReadAtMessagesRef:", scheduleLastReadAtMessagesRef.current);
            isScheduleUpdatingRef.current = false;*/

            axios.post(route('chat_rooms.last_read_at.update', { chatRoom: chatRoom.id }), {
                last_read_at: lastReadAtTime,
            }).then(() => {
                //console.log('last_read_at successfully updated on server', {
                //    chatRoomId: chatRoom.id,
                //   lastReadAtTime,
                //});

                scheduleLastReadAtMessagesRef.current = new Set(Array.from(scheduleLastReadAtMessagesRef.current).filter(
                    m => new Date(m.created_at) > new Date(lastReadAtTime + "Z")
                ));
                //console.log("Remaining messages in scheduleLastReadAtMessagesRef:", scheduleLastReadAtMessagesRef.current);
            }).catch(error => {
                //console.error("Error updating last_read_at:", error);
                scheduleLastReadAtMessagesRef.current = new Set([...scheduleLastReadAtMessagesRef.current, ...scheduledMessages]);
            }).finally(() => {
                //console.debug("Clearing timerLastReadAt");
                isScheduleUpdatingRef.current = false;
            });
        }, 5000);
        /*
        if (scheduleLastReadAtMessages.length === 0 || timerLastReadAt) return;
    
        console.log('Starting timer for updating last_read_at', {
            scheduleLastReadAtMessages,
        });
    
        // 5-second timer when first message is added
        const timer = setTimeout(() => {
            console.log('Timer triggered: Determining newest message', { scheduleLastReadAtMessages });
            const newestMessage = scheduleLastReadAtMessages.reduce((latest, current) => {
                return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
            }, scheduleLastReadAtMessages[0]);
    
            const lastReadAtTime = newestMessage.created_at;
    
            console.log('Posting new last_read_at to server', {
                chatRoomId: chatRoom.id,
                lastReadAtTime,
            });
    
            axios.post(route('chat_rooms.last_read_at.update', { chatRoom: chatRoom.id }), {
                last_read_at: lastReadAtTime,
            }).then(() => {
                console.log('last_read_at successfully updated on server', {
                    chatRoomId: chatRoom.id,
                    lastReadAtTime,
                });
    
                setScheduleLastReadAtMessages(prevMessages => {
                    console.log("Scheduled messages before:", prevMessages);
                    const newMessages = prevMessages.filter(m => new Date(m.created_at) > new Date(lastReadAtTime))
                    console.log("Scheduled messages after:", newMessages);
                    return newMessages;
                });
    
            }).catch(error => {
    
            }).finally(() => {
                console.debug('Clearing timerLastReadAt');
                setTimerLastReadAt(null);
            });
        }, 5000);
    
        setTimerLastReadAt(timer);
    
        return () => clearTimeout(timer);*/
    }, []);

    const addMessageToSchedule = (message) => {
        if (!Array.from(scheduleLastReadAtMessagesRef.current).some(m => m.id === message.id)) {
            //console.debug("Adding message to scheduleLastReadAtMessagesRef", { messageId: message.id });
            scheduleLastReadAtMessagesRef.current = [...scheduleLastReadAtMessagesRef.current, message];

            updateLastReadAtDebounced.current();
        }
    }

    const readMessagesQueueRef = useRef(new Set());
    const debounceUpdateRef = useRef(null);
    const isQueueUpdatingRef = useRef(false);

    const debounce = (fn, delay) => {
        let timer = null;
        return (...args) => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                fn(...args);
                timer = null;
            }, delay);
        };
    };

    const initialLoadingRef = useRef(initialLoading);
    const messagesRefs = useRef(messages);
    useEffect(() => {
        initialLoadingRef.current = initialLoading;
    }, [initialLoading]);

    useEffect(() => {
        messagesRefs.current = messages;
    }, [messages]);

    const onMessageRead = (message) => {
        //console.log("InitialLoading MessageRead:", initialLoading);
        //console.log("InitialLoading MessageRead:", initialLoadingRef.current);
        //if (initialLoadingRef.current !== 2) return;
        //if (isLoadingMoreRef.current !== 0) return;
        //if (messagesLoading) return;
        //console.log('onMessageRead triggered', { messageId: message.id, createdAt: message.created_at });
        //console.log('Current chat found', { chatRoomId: chatRoom.id });

        //console.log("Raw last_read_at:", chatRoom.last_read_at);

        const messageTime = new Date(message.created_at);
        const lastReadTime = new Date(chatRoomRef.current.last_read_at + ".000Z");

        //console.log("Message Read:", {
        //    message: message,
        //    messageTime: messageTime,
        //    lastReadTime: lastReadTime,
        //    checking: messageTime <= lastReadTime,
        //});
        if (messageTime <= lastReadTime) {
            //console.log("Fully read");
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
                    //console.log("AAA:", newestMessage.created_at);
                    //console.log("BBB:", newLastReadAt);

                    setChatRooms(prev =>
                        prev.map(cr => {
                            if (cr.id === chatRoom.id) {
                                const decrements = messagesRefs.current.filter(m => {
                                    const a = (new Date(m.created_at) > new Date(cr.last_read_at + ".000Z"));
                                    const b = (new Date(m.created_at) <= new Date(newestMessage.created_at));
                                    /*console.log("Newer than in cr:", {
                                        message: m.created_at,
                                        messageDate: new Date(m.created_at),
                                        last_read_at: cr.last_read_at + ".000Z",
                                        last_read_atDate: new Date(cr.last_read_at + ".000Z"),
                                        result: a,
                                    });
                                    console.log("Older equal than in newest:", {
                                        message: m.created_at,
                                        messageDate: new Date(m.created_at),
                                        last_read_at: newestMessage.created_at,
                                        last_read_atDate: new Date(newestMessage.created_at),
                                        result: b,
                                    });*/

                                    return (new Date(m.created_at) > new Date(cr.last_read_at + ".000Z"))
                                        && (new Date(m.created_at) <= new Date(newestMessage.created_at))
                                        && m.user_id !== user.id;
                                }

                                );
                                //console.log("Decrements: ", decrements);

                                const newUnreadCount = Math.max((cr.unread_count || 0) - decrements.length, 0);
                                //console.log("Client unread count:", cr.unread_count);
                                //console.log("New unread count:", newUnreadCount);

                                return {
                                    ...cr,
                                    unread_count: newUnreadCount,
                                    last_read_at: newLastReadAt,
                                }
                            }
                            return cr;
                        })
                    );

                    //console.log("Batch update complete", {
                    //    unread_count: Math.max((chatRoom.unread_count || 1) - queueMessages.length, 0),
                    //    last_read_at: newLastReadAt,
                    //});
                }
                isQueueUpdatingRef.current = false;
            }, 20);
        }

        debounceUpdateRef.current();
        addMessageToSchedule(message);
    }

    const performSendMessage = async (messageData) => {
        try {
            const wasAtBottom = (windowStartIndex + VISIBLE_COUNT >= allMessages.length);

            ChatRoomMessage.sendMessage(messageData.message, chatRoom, chatRoomKey, messageData.attachments, progress => {
                setPendingMessages(prev =>
                    prev.map(msg =>
                        msg.id === messageData.id ? { ...msg, uploadProgress: progress } : msg
                    )
                );
            }).then(async response => {
                const decryptedMessage = await ChatRoomMessage.decryptMessage(chatRoomKey, response.data);
                //setTimeout(() => {
                //    onMessageRead(decryptedMessage);
                //}, 100);
                setPendingMessages(prev => prev.filter((msg) => msg.id !== messageData.id));
                //setPendingMessages(prev => removeMessageAdv(prev, messageData));
                //setMessages([...messages, decryptedMessage]);
                setMessages(prev => addUniqueMessages(prev, [decryptedMessage], false));

                const { scrollTop, scrollHeight, clientHeight } = messagesRef.current || {};
                const isNearBottom = scrollHeight - (scrollTop + clientHeight) <= 300;

                //console.log("isNearBottom (Perform)?:", {
                //    scrollHeight,
                //    scrollTop,
                //    clientHeight,
                //    isNearBottom,
                //});
                if (allMessagesRefs.current?.length >= 50) {
                    if (wasAtBottom && isNearBottom) {
                        setWindowStartIndex(prev => {
                            //console.log("Adjusting windowStartIndex after new message at bottom:", {
                            //    prevWindowStartIndex: prev,
                            //    incrementBy: 1
                            //});
                            return prev + 1;
                        });
                    }
                }
                setChatRooms(prev =>
                    prev.map(cr => cr.id === chatRoom.id ? { ...cr, last_message: decryptedMessage } : cr)
                );
            }).catch(error => {
                setPendingMessages(prev =>
                    prev.map((msg) =>
                        msg.id === messageData.id ? { ...msg, errorPending: error.message } : msg
                    )
                );
                setChatRooms(prev =>
                    prev.map(cr => cr.id === chatRoom.id ? { ...cr, last_message: messageData } : cr)
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

    const sendMessage = async () => {
        setSendingMessage(true);
        setErrors({ ...errors, message: '' });

        const diff = windowStartIndex + VISIBLE_COUNT;
        const isVirtualizing = allMessages.length > VISIBLE_COUNT;
        const wasAtBottom = (windowStartIndex + VISIBLE_COUNT >= allMessages.length);

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
            prev.map(cr => cr.id === chatRoom.id ? { ...cr, last_message: placeholderMessage } : cr)
        );

        setPendingMessages(prev => addUniqueMessages(prev, [placeholderMessage], false));

        scrollToLastMessage(wasAtBottom, diff, isVirtualizing);
        setMessage('');
        setMessageAttachments([]);

        await performSendMessage(placeholderMessage);
    };

    const retrySendMessage = async (messageData) => {
        setPendingMessages(prev =>
            prev.map(msg =>
                msg.id === messageData.id ? { ...msg, created_at: new Date().toISOString(), errorPending: null, uploadProgress: 0 } : msg
            )
        );
        setSendingMessage(true);

        await performSendMessage(messageData);
    }

    //const [topMessageIdBeforeLoad, setTopMessageIdBeforeLoad] = useState(null);

    //const prevWindowStartIndexRef = useRef(windowStartIndex);
    //const oldScrollTopRef = useRef(null);
    //const oldScrollHeightRef = useRef(null);

    const anchorMessageIdRef = useRef(null);
    const anchorOffsetRef = useRef(0);
    /*
    const adjustViewportBeforeShift = () => {
        if (messagesRef.current) {
            oldScrollTopRef.current = messagesRef.current.scrollTop;
            oldScrollHeightRef.current = messagesRef.current.scrollHeight;
        }
    }*/



    useEffect(() => {
        //console.log("Why?:", {
        //   anchorMessageIdRef: anchorMessageIdRef.current,
        //    messagesRef: messagesRef.current,
        //    windowMessages,
        //    shouldPreventScroll,
        //});
        if (anchorMessageIdRef.current && messagesRef.current && windowMessages.length > 0 && !shouldPreventScroll) {
            //console.log("Something-something:", {
            //    firstWindowMessage: windowMessages[0].message,
            //});
            const anchorId = anchorMessageIdRef.current;
            const globalIndex = allMessages.findIndex(m => m.id === anchorId);
            if (globalIndex !== -1 && messageRefs.current[globalIndex]) {
                const containerRect = messagesRef.current.getBoundingClientRect();
                const anchorRect = messageRefs.current[globalIndex].getBoundingClientRect();
                const currentOffset = anchorRect.top - containerRect.top;

                const diff = currentOffset - anchorOffsetRef.current;
                messagesRef.current.scrollTop = messagesRef.current.scrollTop + diff;
                //console.log("IT CHANGED!");
            }
        }
        anchorMessageIdRef.current = null;
        anchorOffsetRef.current = 0;

        setShouldPreventScroll(false);
    }, [windowMessages]);

    /*
    const setAnchorMessage = (isScrollingUp) => {
        if (!messagesRef.current || windowMessages.length === 0) return;
    
        const containerRect = messagesRef.current.getBoundingClientRect();
        const anchorIndex = isScrollingUp ? 0 : windowMessages.length - 1;
    
        const anchorEl = messageRefs.current[anchorIndex];
        if (!anchorEl) return;
    
        const anchorRect = anchorEl.getBoundingClientRect();
        anchorMessageIdRef.current = windowMessages[anchorIndex].id;
        anchorOffsetRef.current = anchorRect.top - containerRect.top;
    }*/

    const setAnchorMessage = (isScrollingUp) => {
        //console.log("Anchor why?:", {
        //    messagesRef: messagesRef.current,
        //    windowMessagesLength: windowMessages.length,
        //})
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
        const globalIndex = allMessages.findIndex(m => m.id === anchorMessage.id);
        const anchorEl = messageRefs.current[globalIndex];
        //console.log("Visibility:", {
        //    fullyVisible,
        //    partiallyVisible,
        //    anchorIndex,
        //    globalIndex,
        //    anchorEl,
        //});
        if (!anchorEl) return;

        const anchorRect = anchorEl.getBoundingClientRect();
        anchorMessageIdRef.current = anchorMessage.id;
        anchorOffsetRef.current = anchorRect.top - containerRect.top;
        //console.log("Anchoring:", {
        //    anchorMessageIdRef,
        //    anchorOffsetRef,
        //});
    };


    const messagesScrollHandler = () => {
        if (messagesLoading && isLoadingMoreRef.current !== 0) {
            //console.log("Indeed loading");
            const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;

            lastKnownScrollTopRef.current = scrollTop;
            if (windowMessages.length > 0) {
                lastKnownAnchorMessageIdRef.current = windowMessages[0].id;
            }
            //console.log("Loading/Restoring:", restoringState);
            if (restoringState) return;

            const threshold = 50;
            const atTop = scrollTop <= threshold;
            const atBottom = scrollHeight - (scrollTop + clientHeight) <= threshold;

            const bufferSize = 20; // Airbag

            //console.log("Loading/TopBottomStates:", {
            //    threshold,
            //    scrollTop,
            //    atTop,
            //    atBottom,
            //    scrollState,
            //});
            if (atTop && scrollState !== 'upper') {
                setScrollState('upper');
                //console.log("Loading/Scrolling up!");
                setAnchorMessage(true);
            } else if (atBottom && scrollState !== 'bottom') {
                setScrollState('bottom');
                //console.log("Loading/Scrolling down!");
                setAnchorMessage(false);
            } else if (!atTop && !atBottom && scrollState !== 'middle') {
                setScrollState('middle');
                //console.log(scrollState);
            }
        }
        //console.log("ASDASDSA:", {
        //    messagesLoading,
        //    initialLoadingRef: initialLoadingRef.current,
        //    cacheLoading,
        //    isLoadingMoreRef: isLoadingMoreRef.current,
        //    hasMessages,
        //    messagesRef: messagesRef,
        //})
        if (
            messagesLoading &&
            initialLoadingRef.current !== 2 ||
            cacheLoading ||
            isLoadingMoreRef.current !== 0 ||
            !hasMessages ||
            !messagesRef.current
        ) return;

        const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;

        lastKnownScrollTopRef.current = scrollTop;
        if (windowMessages.length > 0) {
            lastKnownAnchorMessageIdRef.current = windowMessages[0].id;
        }

        if (restoringState) return;

        const threshold = 50;
        const atTop = scrollTop <= threshold;
        const atBottom = scrollHeight - (scrollTop + clientHeight) <= threshold;

        const bufferSize = 20; // Airbag

        //console.log("Logging scroll:", {
        //    atTop,
        //    scrollState,
        //    check: scrollState !== 'upper',
        //});
        if (atTop && scrollState !== 'upper') {
            setScrollState('upper');
            //console.log("Scrolling up!");
            setAnchorMessage(true);

            //console.log("Is it?:", {
            //    windowStartIndex,
            //    bufferSize,
            //    check: windowStartIndex > bufferSize,
            //});

            if (windowStartIndex > 0) {
                setWindowStartIndex(prev => Math.max(0, prev - 10));
            }

            if (windowStartIndex <= bufferSize) {
                const startId = messages[0]?.id;
                if (startId) {
                    //console.log("Airbag: Loading messages above");
                    loadMore(true, 20, startId, true, false);
                }
            }
        } else if (atBottom && scrollState !== 'bottom') {
            setScrollState('bottom');
            //console.log("Scrolling down!");
            setAnchorMessage(false);

            const totalCount = allMessages.length;
            const remaining = totalCount - (windowStartIndex + VISIBLE_COUNT);
            //console.log("Remaining:", {
            //    remaining: remaining,
            //   bufferSize: bufferSize,
            //    check: remaining > bufferSize,
            //});

            if (remaining > 0) {
                setWindowStartIndex(prev => {
                    const shift = Math.min(remaining, 10);
                    //console.log("Shifting to remaining messages:", { remaining, prev, shift, result: Math.min(prev + shift, Math.max(0, totalCount - VISIBLE_COUNT)) });
                    return Math.min(prev + shift, Math.max(0, totalCount - VISIBLE_COUNT));
                });
            }

            //console.log("Hi");

            if (remaining <= bufferSize) {
                const startId = messages[messages.length - 1]?.id
                if (startId && startId !== lastMessage.id) {
                    //console.log("Airbag: Loading messages below");
                    loadMore(true, 20, startId, false, true);
                } else if (remaining > 0) {

                }
            }
        } else if (!atTop && !atBottom && scrollState !== 'middle') {
            setScrollState('middle');
            //console.log(scrollState);
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
                //setPendingMessages(prev => removeMessageAdv(prev, message));
                setPendingMessages(prev => prev.filter(msg => msg.id !== message.id));
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
            if (availableToSendMessage()) {
                sendMessage();
            }
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
            setTimeout(() => {
                if (messagesRef.current) {
                    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
                }
            }, 0);
        }
    }, [initialLoading, allMessages]);

    useEffect(() => {
        lastKnownWindowStartIndexRef.current = windowStartIndex;
    }, [windowStartIndex]);

    const saveChatRoomState = () => {
        const state = {
            windowStartIndex: lastKnownWindowStartIndexRef.current,
            scrollTop: lastKnownScrollTopRef.current,
            messageId: lastKnownAnchorMessageIdRef.current,
            //
        };
        //console.log("Saving:", state);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    };

    useEffect(() => {
        const handleBeforeUnload = () => {
            saveChatRoomState();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        //console.log("HERE");

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            saveChatRoomState();
            //console.log("BYE-BYE");
        };
    }, [chatRoom.id]);

    useEffect(() => {
        //console.log("Restoring?:", restoringState);
        if (restoringState === 1 && chatRoomKey && messagesRef.current) {
            const savedState = localStorage.getItem(STORAGE_KEY);
            if (savedState) {
                const { windowStartIndex: savedIndex, scrollTop, messageId } = JSON.parse(savedState);
                if (typeof savedIndex === 'number' && allMessages.some(m => m.id === messageId)) {
                    setWindowStartIndex(savedIndex);

                    setTimeout(() => {
                        //console.log("Lucky!");
                        if (messagesRef.current) {
                            messagesRef.current.scrollTop = scrollTop;
                        }
                    }, 0);
                } else {
                    //console.log("Not today:", {
                    //    savedIndex: savedIndex,
                    //    scrollTop: scrollTop,
                    //    messageId: messageId,
                    //});
                }
            }
            setRestoringState(0);
        }
    }, [restoringState, chatRoomKey]);

    const computedMessages = useMemo(() => {
        let processedMessages = [];

        //const filteredMessages = allMessages.filter(message => !message.message_iv);

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
        if (restoringState) return;

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

        /*
        windowMessages.forEach((message, i, array) => {
            const prevMessage = i > 0 ? array[i - 1] : null;
            const nextMessage = i < array.length - 1 ? array[i + 1] : null;
 
            const messageDate = new Date(message.created_at);
 
            const messageDateStr = messageDate.toDateString();
            const prevMessageDateStr = prevMessage ? (new Date(prevMessage.created_at)).toDateString() : null;
 
            const elements = [];
 
            if (messageDateStr !== prevMessageDateStr) {
                const now = new Date();
                const isSameYear = messageDate.getFullYear() === now.getFullYear();
 
                let dateFormatOptions = { month: 'long', day: 'numeric' };
                if (!isSameYear) {
                    dateFormatOptions.year = 'numeric';
                }
 
                const dateLabel = messageDate.toLocaleDateString(undefined, dateFormatOptions);
 
                elements.push(
                    <div key={`date-${messageDateStr}-${i}`} className="mt-1 mb-1 text-center select-none">
                        <div className="inline-block px-3 rounded-full bg-gray-200 opacity-75 cursor-pointer">
                            <span className="text-sm">{dateLabel}</span>
                        </div>
                    </div>
                );
            }
 
            const isStartOfGroup = (message, prevMessage) => {
                if (!prevMessage) return true;
                if (prevMessage.user_id !== message.user_id) return true;
                const timeDiff = new Date(message.created_at) - new Date(prevMessage.created_at);
                return timeDiff > 5 * 60 * 1000;
            };
 
            const isEndOfGroup = (message, nextMessage) => {
                if (!nextMessage) return true;
                if (nextMessage.user_id !== message.user_id) return true;
                const timeDiff = new Date(nextMessage.created_at) - new Date(message.created_at);
                return timeDiff > 5 * 60 * 1000;
            };
 
            const startOfGroup = isStartOfGroup(message, prevMessage);
            const endOfGroup = isEndOfGroup(message, nextMessage);
 
            let messageType;
            if (startOfGroup && endOfGroup) {
                messageType = 'singular';
            } else if (startOfGroup) {
                messageType = 'top';
            } else if (endOfGroup) {
                messageType = 'last';
            } else {
                messageType = 'middle';
            }
 
            let gap = '';
            if (i === 0) {
                gap = '';
            } else {
                if (messageType === 'singular') {
                    gap = 'mt-1 mb-1';
                } else if (messageType === 'top') {
                    gap = 'mt-1';
                } else if (messageType === 'last') {
                    gap = 'mb-1';
                }
            }
 
            elements.push(
                <ChatMessage
                    key={`${message.id}`}
                    className={`${gap} ${(removingMessage && removingMessage.id === message.id)
                        ? 'transition-opacity opacity-30 duration-500 ease-in ' : ''}`}
                    ref={(el) => setMessageRef(el, i)}
                    self={user.id === message.user_id}
                    message={message}
                    messageType={messageType}
                    onMessageRead={onMessageRead}
                    onMessageRemoved={() => removeMessage(message)}
                    isPlaceholder={message.isPlaceholder}
                    errorPending={message.errorPending}
                    uploadProgress={message.uploadProgress}
                    onRetrySend={() => retrySendMessage(message)}
                    chatRoom={chatRoom}
                />
            )
            outputElements.push(...elements);
        });*/

        return outputElements;
    }, [windowMessages, initialLoading, restoringState, allMessages]);

    return (
        <ChatRoomContextProvider value={{ chatRoom, chatRoomKey }}>
            <div className={``}>
                <div
                    className={`
                        h-[calc(100dvh-15rem)] sm:h-[calc(100dvh-19rem)]
                        overflow-y-auto
                        flex flex-col py-3
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
                                disabled={!availableToSendMessage()}
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
