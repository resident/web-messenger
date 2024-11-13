import ChatMessage from "@/Pages/ChatRoom/Partials/ChatMessage.jsx";
import TextArea from "@/Components/TextArea.jsx";
import PrimaryButton from "@/Components/PrimaryButton.jsx";
import InputError from "@/Components/InputError.jsx";
import SelectAttachments from "@/Pages/ChatRoom/Partials/SelectAttachments.jsx";
import AutoDeleteSettings from "@/Pages/ChatRoom/Partials/AutoDeleteSettings.jsx";
import { ChatRoomContextProvider } from "@/Pages/ChatRoom/ChatRoomContext.jsx";
import { useContext, useEffect, useRef, useState } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";
import Emojis from "@/Components/Emojis.jsx";
import ChatRoom from "@/Common/ChatRoom.js";
import ChatRoomMessage from "@/Common/ChatRoomMessage.js";
import RecordAudioMessage from "./RecordAudioMessage";

export default function ChatRoomMessages({ ...props }) {
    const {
        user,
        userPrivateKey,
        chatRooms,
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
    const [messageSelectionStart, setMessageSelectionStart] = useState(0);
    const [messageSelectionEnd, setMessageSelectionEnd] = useState(0);

    const [pendingMessages, setPendingMessages] = useState([]);

    const messagesRef = useRef();
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

    useEffect(() => {
        const freshChatRoom = chatRooms.find(item => item.id === chatRoom.id);

        if (freshChatRoom) {
            setChatRoom(freshChatRoom);
        } else {
            //todo exit from this room
        }

    }, [chatRooms]);

    const setMessageRef = (el, index) => {
        messageRefs.current[index] = el;
    };

    const scrollToMessage = (index) => {
        setTimeout(() => {
            messageRefs.current[index].scrollIntoView({
                behavior: 'instant',
                block: 'start',
            });
        }, 100);

        setScrollTo(null);
    };

    const scrollToLastMessage = () => scrollToMessage(messages.length - 1);

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

    useEffect(() => {
        if (messagesOperation) {
            let newMessages = [];

            switch (messagesOperation.type) {
                case messagesOperationTypes.push: {
                    newMessages = [...messages, messagesOperation.message];
                    break;
                }

                case messagesOperationTypes.remove: {
                    newMessages = messages.filter(m => m.id !== messagesOperation.message.id);
                    break;
                }
            }

            setMessages(newMessages);
            setMessagesOperation(null);
        }

    }, [messages, messagesOperation]);

    useEffect(() => {
        const combinedMessages = [...messages, ...pendingMessages];
        if (combinedMessages.length > 0) {
            setHasMessages(true);

            if (scrollTo === 'bottom') {
                scrollToMessage(combinedMessages.length - 1);
            } else if (scrollTo === 'top') {
                scrollToMessage(combinedMessages.length - prevMessagesLength);
            }
        } else {
            setHasMessages(false);
        }
    }, [messages, pendingMessages]);

    /*
    const markMessagesAsDelivered = (messageIds) => {
        axios.post(route('chat_rooms.messages.mark_as_delivered', chatRoom.id), {
            message_ids: messageIds
        }).catch(error => {

        })
    }*/

    const loadMessages = (count = null, startId = null) => {
        if (messagesLoading) return;

        setMessagesLoading(true);

        setPrevMessagesLength(messages.length);

        axios.get(route('chat_rooms.messages.index', { chatRoom: chatRoom.id, count, startId }))
            .then(async (response) => {
                const loadedMessages = [];

                for (const message of response.data) {
                    const decryptedMessage = await ChatRoomMessage.decryptMessage(chatRoomKey, message);

                    loadedMessages.push(decryptedMessage);
                }

                setMessages([...loadedMessages, ...messages]);

                if (loadedMessages.length > 0) {
                    setScrollTo(startId ? scrollToDirection.top : scrollToDirection.bottom);

                    /*
                    const messageIds = loadedMessages
                        .filter(msg => msg.status === 'SENT' && msg.user_id !== user.id)
                        .map(msg => msg.id);
                    markMessagesAsDelivered(messageIds);*/
                }
            })
            .finally(() => {
                setMessagesLoading(false);
            });
    };

    const onChatRoomMessageSent = (e) => {
        (async () => {
            const decryptedMessage = await ChatRoomMessage.decryptMessage(chatRoomKey, e.message);

            pushMessage(decryptedMessage);

            setScrollTo(scrollToDirection.bottom);

            /*
            if (decryptedMessage.user_id !== user.id) {
                markMessagesAsDelivered([decryptedMessage.id]);
            }*/
        })();
    };

    const onChatRoomMessageRemoved = (e) => {
        removeMessage(e.message);
    };

    const onChatRoomUpdated = (e) => {
        setChatRoom({ ...chatRoom, ...e.chatRoom });
    };

    useEffect(() => {
        const channelName = `chat-room.${chatRoom.id}`;
        const channel = Echo.private(channelName);

        if (chatRoomKey) {
            loadMessages(20);

            channel
                .listen('ChatRoomMessageSent', onChatRoomMessageSent)
                .listen('ChatRoomMessageRemoved', onChatRoomMessageRemoved)
                .listen('ChatRoomUpdated', onChatRoomUpdated)
                .listen('ChatRoomMessageStatusUpdated', onChatRoomMessageStatusUpdated);
        } else {
            setMessages([]);
        }

        return () => {
            channel
                .stopListening('ChatRoomMessageRemoved')
                .stopListening('ChatRoomUpdated')
                .stopListening('ChatRoomMessageStatusUpdated');
        };
    }, [chatRoomKey]);

    const onChatRoomMessageStatusUpdated = (e) => {
        const updatedMessage = e.message;

        setMessages(prev => prev.map(
            msg => msg.id === updatedMessage.id ? { ...msg, status: updatedMessage.status } : msg
        ));
    };

    const performSendMessage = async (messageData) => {
        try {
            ChatRoomMessage.sendMessage(messageData.message, chatRoom, chatRoomKey, messageData.attachments, progress => {
                setPendingMessages(prev =>
                    prev.map(msg =>
                        msg.id === messageData.id ? { ...msg, uploadProgress: progress } : msg
                    )
                );
            }).then(async response => {
                const decryptedMessage = await ChatRoomMessage.decryptMessage(chatRoomKey, response.data);

                setPendingMessages(prev => prev.filter((msg) => msg.id !== messageData.id));
                setMessages([...messages, decryptedMessage]);
            }).catch(error => {
                setPendingMessages(prev =>
                    prev.map((msg) =>
                        msg.id === messageData.id ? { ...msg, errorPending: true } : msg
                    )
                );
                setErrors({ ...errors, message: error.message });
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
            errorPending: false,
            uploadProgress: 0,
        };

        setPendingMessages([...pendingMessages, placeholderMessage]);
        setScrollTo(scrollToDirection.bottom);
        setMessage('');
        setMessageAttachments([]);

        await performSendMessage(placeholderMessage);
    };

    const retrySendMessage = async (messageData) => {
        setPendingMessages(prev =>
            prev.map(msg =>
                msg.id === messageData.id ? { ...msg, errorPending: false, uploadProgress: 0 } : msg
            )
        );

        setSendingMessage(true);

        await performSendMessage(messageData);
    }

    const messagesScrollHandler = () => {
        if (hasMessages && messagesRef.current.scrollTop === 0) {
            const startId = messages[0].id;

            loadMessages(10, startId);
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

        setTimeout(() => {
            if (message.isPlaceholder && message.errorPending) {
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
        return (message.trim().length || messageAttachments.length) && !sendingMessage;
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
        if (messagesLoading && messages.length === 0 && pendingMessages.length === 0) {
            setTimeout(() => {
                if (messagesRef.current) {
                    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
                }
            }, 0);
        }
    })

    return (
        <ChatRoomContextProvider value={{ chatRoom, chatRoomKey }}>
            <div className={``}>
                <div
                    className={`
                        h-[calc(100dvh-15rem)] sm:h-[calc(100dvh-19rem)]
                        overflow-y-auto
                        flex flex-col gap-y-4 p-6
                    `}
                    ref={messagesRef}
                    onScroll={messagesScrollHandler}
                >
                    {[...messages, ...pendingMessages].map((message, i) => (
                        <ChatMessage
                            key={`${i}:${message.id}`}
                            className={(removingMessage && removingMessage.id === message.id)
                                ? 'transition-opacity opacity-30 duration-500 ease-in ' : ''}
                            ref={(el) => setMessageRef(el, i)}
                            self={user.id === message.user_id}
                            message={message}
                            onMessageRemoved={() => removeMessage(message)}
                            isPlaceholder={message.isPlaceholder}
                            errorPending={message.errorPending}
                            uploadProgress={message.uploadProgress}
                            onRetrySend={() => retrySendMessage(message)}
                        />
                    ))}


                    {messagesLoading && messages.length === 0 && pendingMessages.length === 0 && (
                        <>
                            {[...Array(2)].map((_, index) => (
                                <div key={`skeleton-left-${index}`} className="first:mt-auto flex items-end max-w-xl self-start animate-pulse space-x-3 group">
                                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                                    <div className="flex-1 space-y-4 py-1 w-40">
                                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                                        <div className="h-4 bg-gray-300 rounded w-full"></div>
                                    </div>
                                </div>
                            ))}
                            {[...Array(4)].map((_, index) => (
                                <div key={`skeleton-right-${index}`} className="first:mt-auto flex items-end max-w-xl self-end animate-pulse space-x-3 group">
                                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                                    <div className="flex-1 space-y-4 py-1 w-40">
                                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                                        <div className="h-4 bg-gray-300 rounded w-full"></div>
                                    </div>
                                </div>
                            ))}
                            {[...Array(3)].map((_, index) => (
                                <div key={`skeleton-left-${index}`} className="first:mt-auto flex items-end max-w-xl self-start animate-pulse space-x-3 group">
                                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                                    <div className="flex-1 space-y-4 py-1 w-40">
                                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                                        <div className="h-4 bg-gray-300 rounded w-full"></div>
                                    </div>
                                </div>
                            ))}
                            {[...Array(2)].map((_, index) => (
                                <div key={`skeleton-right-${index}`} className="first:mt-auto flex items-end max-w-xl self-end animate-pulse space-x-3 group">
                                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                                    <div className="flex-1 space-y-4 py-1 w-40">
                                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                                        <div className="h-4 bg-gray-300 rounded w-full"></div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
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

                    <div>
                        <InputError message={errors.message} className="mt-2" />
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
