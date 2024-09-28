import ChatMessage from "@/Pages/ChatRoom/Partials/ChatMessage.jsx";
import TextArea from "@/Components/TextArea.jsx";
import ProgressBar from "@/Components/ProgressBar.jsx";
import PrimaryButton from "@/Components/PrimaryButton.jsx";
import InputError from "@/Components/InputError.jsx";
import SelectAttachments from "@/Pages/ChatRoom/Partials/SelectAttachments.jsx";
import AutoDeleteSettings from "@/Pages/ChatRoom/Partials/AutoDeleteSettings.jsx";
import {ChatRoomContextProvider} from "@/Pages/ChatRoom/ChatRoomContext.jsx";
import {useContext, useEffect, useRef, useState} from "react";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";
import RSAEncryptor from "@/Encryption/RSAEncryptor.js";
import AESKeyGenerator from "@/Encryption/AESKeyGenerator.js";
import AESEncryptor from "@/Encryption/AESEncryptor.js";
import Emojis from "@/Components/Emojis.jsx";

export default function ChatRoomMessages(props) {
    const {
        user,
        userPublicKey,
        userPrivateKey,
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

    const decryptChatRoomKey = async () => {
        const rsaEncryptor = new RSAEncryptor();

        await rsaEncryptor.importPublicKey(userPublicKey);
        await rsaEncryptor.importPrivateKey(userPrivateKey);

        return await rsaEncryptor.decrypt(chatRoom.pivot.chat_room_key);
    };

    useEffect(() => {
        if (userPublicKey && userPrivateKey) {
            (async () => {
                setChatRoomKey(await decryptChatRoomKey());
            })();
        } else {
            setChatRoomKey(null);
        }
    }, [userPublicKey, userPrivateKey]);

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

    const encryptMessage = async (message) => {
        const messageKey = await AESKeyGenerator.generateKey();

        const aesEncryptor = new AESEncryptor();
        await aesEncryptor.importKey(messageKey);
        const {iv: messageIv, encrypted: messageEncrypted} = await aesEncryptor.encryptString(message);

        setMessage('');

        await aesEncryptor.importKey(chatRoomKey);
        const {iv: messageKeyIv, encrypted: messageKeyEncrypted} = await aesEncryptor.encryptString(messageKey);

        return {messageEncrypted, messageIv, messageKeyEncrypted, messageKeyIv};
    };

    const decryptMessage = async (message) => {
        const aesEncryptor = new AESEncryptor();
        await aesEncryptor.importKey(chatRoomKey);
        const messageKey = await aesEncryptor.decryptString(message.message_key, message.message_key_iv);

        await aesEncryptor.importKey(messageKey);
        message.message = await aesEncryptor.decryptString(message.message, message.message_iv);

        delete message.message_iv;
        delete message.message_key;
        delete message.message_key_iv;

        return message;
    };

    const fileToArrayBuffer = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    const encryptAttachment = async (attachment) => {
        const attachmentKey = await AESKeyGenerator.generateKey();
        const aesEncryptor = new AESEncryptor();
        await aesEncryptor.importKey(attachmentKey);

        const attachmentArrayBuffer = await fileToArrayBuffer(attachment);

        const {encrypted: attachmentEncrypted, iv: attachmentIv} = await aesEncryptor.encryptRaw(attachmentArrayBuffer);

        await aesEncryptor.importKey(chatRoomKey);

        const {
            encrypted: attachmentKeyEncrypted,
            iv: attachmentKeyIv
        } = await aesEncryptor.encryptString(attachmentKey);

        return {
            name: attachment.name,
            size: attachment.size,
            mimeType: attachment.type ?? 'application/octet-stream',
            attachment: attachmentEncrypted,
            attachmentIv,
            attachmentKey: attachmentKeyEncrypted,
            attachmentKeyIv,
        };
    };

    const encryptAttachments = (attachments) => {
        const promises = [];

        attachments.forEach((attachment) => {
            const promise = encryptAttachment(attachment);

            promises.push(promise);
        });

        return Promise.all(promises);
    };

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

        axios.get(route('chat_rooms.messages.index', {chatRoom: chatRoom.id, count, startId}))
            .then(async (response) => {
                const loadedMessages = [];

                for (const message of response.data) {
                    const decryptedMessage = await decryptMessage(message);

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
            const decryptedMessage = await decryptMessage(e.message);

            pushMessage(decryptedMessage);

            setScrollTo(scrollToDirection.bottom);
        })();
    };

    const onChatRoomMessageRemoved = (e) => {
        removeMessage(e.message);
    };

    const onChatRoomUpdated = (e) => {
        setChatRoom({...chatRoom, ...e.chatRoom});
    };

    useEffect(() => {
        const channel = `chat-room.${chatRoom.id}`;

        if (chatRoomKey) {
            loadMessages();

            Echo.registerAxiosRequestInterceptor();

            Echo.private(channel)
                .listen('ChatRoomMessageSent', onChatRoomMessageSent)
                .listen('ChatRoomMessageRemoved', onChatRoomMessageRemoved)
                .listen('ChatRoomUpdated', onChatRoomUpdated);
        } else {
            setMessages([]);
        }

        return () => {
            Echo.leave(channel);

        };
    }, [chatRoomKey]);

    const sendMessage = async () => {
        setSendingMessage(true);
        setErrors({...errors, message: ''});

        try {
            const {messageEncrypted, messageIv, messageKeyEncrypted, messageKeyIv} = await encryptMessage(message);

            const attachments = await encryptAttachments(messageAttachments);

            axios.post(route('chat_rooms.messages.store', chatRoom.id), {
                message: messageEncrypted,
                messageIv,
                messageKey: messageKeyEncrypted,
                messageKeyIv,
                attachments,
            }, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-Socket-ID': Echo.socketId(),
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            }).then(async response => {
                const decryptedMessage = await decryptMessage(response.data);

                setMessages([...messages, decryptedMessage]);

                setMessageAttachments([]);
            }).catch(error => {
                setErrors({...errors, message: error});
            }).finally(() => {
                setUploadProgress(0);
                setSendingMessage(false);
                setScrollTo(scrollToDirection.bottom);
            });
        } catch (e) {
            if (e instanceof ProgressEvent) {
                setErrors({...errors, message: e.target.error.message});
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

    const handleKeyDown = (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            if (availableToSendMessage()) {
                sendMessage();
            }
        }
    };

    const insertSmile = (emoji) => {
        const input = messageInputRef.current;
        const startPos = input.selectionStart;
        const endPos = input.selectionEnd;

        const newMessage = message.slice(0, startPos) + emoji + message.slice(endPos);

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
        <ChatRoomContextProvider value={{chatRoom, chatRoomKey}}>
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
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
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
                <InputError message={errors.message} className="mt-2"/>
            </div>

            <div className={`flex gap-3 justify-center mt-2`}>
                <Emojis onSmileSelected={insertSmile}/>

                <SelectAttachments
                    selectedFiles={messageAttachments}
                    setSelectedFiles={setMessageAttachments}
                />

                <AutoDeleteSettings/>
            </div>
        </ChatRoomContextProvider>
    );
}
