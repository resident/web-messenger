import ChatMessage from "@/Pages/ChatRoom/Partials/ChatMessage.jsx";
import TextArea from "@/Components/TextArea.jsx";
import ProgressBar from "@/Components/ProgressBar.jsx";
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

export default function ChatRoomMessages(props) {
    const {
        user,
        userPublicKey,
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
    const [uploadProgress, setUploadProgress] = useState(0);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [prevMessagesLength, setPrevMessagesLength] = useState(0);
    const [scrollTo, setScrollTo] = useState(null);
    const [messageSelectionStart, setMessageSelectionStart] = useState(0);
    const [messageSelectionEnd, setMessageSelectionEnd] = useState(0);

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
            ChatRoom.decryptChatRoomKey(userPrivateKey, chatRoom.pivot.chat_room_key).then(chatRoomKey => {
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
        if (messages.length > 0) {
            setHasMessages(true);

            if (scrollTo === 'bottom') {
                scrollToLastMessage();
            } else if (scrollTo === 'top') {
                scrollToMessage(messages.length - prevMessagesLength);
            }
        } else {
            setHasMessages(false);
        }
    }, [messages]);

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
        })();
    };

    const onChatRoomMessageRemoved = (e) => {
        removeMessage(e.message);
    };

    const onChatRoomUpdated = (e) => {
        setChatRoom({ ...chatRoom, ...e.chatRoom });
    };

    useEffect(() => {
        const channel = `chat-room.${chatRoom.id}`;

        if (chatRoomKey) {
            loadMessages();

            Echo.private(channel)
                .listen('ChatRoomMessageSent', onChatRoomMessageSent)
                .listen('ChatRoomMessageRemoved', onChatRoomMessageRemoved)
                .listen('ChatRoomUpdated', onChatRoomUpdated);
        } else {
            setMessages([]);
        }

        return () => {
            Echo.private(channel)
                .stopListening('ChatRoomMessageSent')
                .stopListening('ChatRoomMessageRemoved')
                .stopListening('ChatRoomUpdated');
        };
    }, [chatRoomKey]);

    const sendMessage = async () => {
        setSendingMessage(true);
        setErrors({ ...errors, message: '' });

        try {
            ChatRoomMessage.sendMessage(message, chatRoom, chatRoomKey, messageAttachments, progress => {
                setUploadProgress(progress)
            }).then(async response => {
                const decryptedMessage = await ChatRoomMessage.decryptMessage(chatRoomKey, response.data);

                setMessage('');
                setMessages([...messages, decryptedMessage]);

                setMessageAttachments([]);
            }).catch(error => {
                setErrors({ ...errors, message: error });
            }).finally(() => {
                setUploadProgress(0);
                setSendingMessage(false);
                setScrollTo(scrollToDirection.bottom);
            });
        } catch (e) {
            if (e instanceof ProgressEvent) {
                setErrors({ ...errors, message: e.target.error.message });
            }

            setSendingMessage(false);
            setMessageAttachments([]);
        }
    };

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
            setMessagesOperation({
                type: messagesOperationTypes.remove,
                message: message,
            });
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

    return (
        <ChatRoomContextProvider value={{ chatRoom, chatRoomKey }}>
            <div
                className="h-[calc(100vh-24rem)] overflow-y-auto flex flex-col gap-y-4 p-6 mb-4"
                ref={messagesRef}
                onScroll={messagesScrollHandler}
            >

                {messages.map((message, i) => (
                    <ChatMessage
                        key={`${i}:${message.id}`}
                        className={(removingMessage && removingMessage.id === message.id)
                            ? 'transition-opacity opacity-30 duration-500 ease-in ' : ''}
                        ref={(el) => setMessageRef(el, i)}
                        self={user.id === message.user_id}
                        message={message}
                        onMessageRemoved={() => removeMessage(message)}
                    />
                ))}

            </div>

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

                    <ProgressBar
                        className={`mt-1 ${!sendingMessage ? 'hidden' : ''}`}
                        progress={uploadProgress}
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

            <div className={`flex gap-3 justify-center mt-2`}>
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
        </ChatRoomContextProvider>
    );
}
