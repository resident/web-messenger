import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Head} from '@inertiajs/react';
import PrimaryButton from "@/Components/PrimaryButton.jsx";
import TextInput from "@/Components/TextInput.jsx";
import ChatMessage from "@/Pages/ChatRoom/Partials/ChatMessage.jsx";
import {useEffect, useRef, useState} from "react";
import InputError from "@/Components/InputError.jsx";
import AESKeyGenerator from "@/Encryption/AESKeyGenerator.js";
import AESEncryptor from "@/Encryption/AESEncryptor.js";
import RSAEncryptor from "@/Encryption/RSAEncryptor.js";
import UserRsaKeysStorage from "@/Common/UserRsaKeysStorage.js";

export default function Show({auth, chatRoom}) {
    const [chatRoomKey, setChatRoomKey] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [errors, setErrors] = useState({});
    const [messagesLoading, setMessagesLoading] = useState(false);

    const messagesRef = useRef();
    const messageInputRef = useRef();

    const aesEncryptor = new AESEncryptor();

    useEffect(() => {
        (async () => {
            const userRsaKeyStorage = new UserRsaKeysStorage();
            const rsaEncryptor = new RSAEncryptor();

            const {publicKey, privateKey} = userRsaKeyStorage.getKeysFromSession();

            await rsaEncryptor.importPublicKey(publicKey);
            await rsaEncryptor.importPrivateKey(privateKey);

            setChatRoomKey(await rsaEncryptor.decrypt(chatRoom.pivot.chat_room_key));
        })();
    }, []);

    const decryptMessage = async (message) => {
        await aesEncryptor.importKey(chatRoomKey);
        const messageKey = await aesEncryptor.decrypt(message.message_key, message.message_key_iv);

        await aesEncryptor.importKey(messageKey);
        message.message = await aesEncryptor.decrypt(message.message, message.message_iv);

        delete message.message_iv;
        delete message.message_key;
        delete message.message_key_iv;

        return message;
    };

    const saveScrollPosition = () => {
        if (!messagesRef.current.scrollHeight) return 0;

        const {scrollHeight, scrollTop, clientHeight} = messagesRef.current;

        return scrollHeight - scrollTop - clientHeight;
    };

    const restoreScrollPosition = (distance) => {
        if (!messagesRef.current.scrollHeight) return;

        const {scrollHeight, clientHeight} = messagesRef.current;

        messagesRef.current.scrollTop = scrollHeight - clientHeight - distance;
    };

    const loadMessages = (count = null, startId = null) => {
        if (messagesLoading) return;

        setMessagesLoading(true);

        const distanceFromBottom = startId ? saveScrollPosition() : 0;

        axios.get(route('chat_rooms.messages.index', {chatRoom: chatRoom.id, count, startId}))
            .then(async (response) => {
                const loadedMessages = [];

                for (const message of response.data) {
                    const decryptedMessage = await decryptMessage(message);

                    loadedMessages.push(decryptedMessage);
                }

                setMessages([...loadedMessages, ...messages]);
            })
            .finally(() => {
                setMessagesLoading(false);

                setTimeout(() => restoreScrollPosition(distanceFromBottom), 0);
            });
    };

    useEffect(() => {
        if (!chatRoomKey) return;

        loadMessages();
    }, [chatRoomKey]);

    useEffect(() => {
        if (!chatRoomKey) return;

        Echo.private(`chat-room.${chatRoom.id}`)
            .listen('ChatRoomMessageSent', async (e) => {
                const decryptedMessage = await decryptMessage(e.message);

                setMessages([...messages, decryptedMessage]);

                setTimeout(() => restoreScrollPosition(0), 0);
            });
    }, [chatRoomKey, messages]);

    const sendMessage = async (e) => {
        e.preventDefault();

        const messageKey = await AESKeyGenerator.generateKey();

        await aesEncryptor.importKey(messageKey);
        const {iv: messageIv, encrypted: messageEncrypted} = await aesEncryptor.encrypt(message);

        setMessage('');

        await aesEncryptor.importKey(chatRoomKey);
        const {iv: messageKeyIv, encrypted: messageKeyEncrypted} = await aesEncryptor.encrypt(messageKey);

        axios.post(route('chat_rooms.messages.store', chatRoom.id), {
            message: messageEncrypted,
            message_iv: messageIv,
            message_key: messageKeyEncrypted,
            message_key_iv: messageKeyIv,
        }, {
            headers: {
                'X-Socket-ID': Echo.socketId(),
            }
        }).then(async response => {
            const decryptedMessage = await decryptMessage(response.data);

            setMessages([...messages, decryptedMessage]);

            setTimeout(() => restoreScrollPosition(0), 0);
        }).catch(error => {
            console.log(error);
        });
    };

    const messagesScrollHandler = async (e) => {
        if (messagesRef.current.scrollTop === 0) {
            const startId = messages[0].id;

            loadMessages(10, startId);
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Chat Room</h2>}
        >
            <Head title="Chat Room"/>

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="w-3/4 m-auto">
                                <h2 className="font-bold mb-3">{chatRoom.title}</h2>

                                <div
                                    className="h-[calc(100vh-24rem)] overflow-y-auto flex flex-col gap-y-4 p-6 mb-4"
                                    ref={messagesRef}
                                    onScroll={messagesScrollHandler}
                                >
                                    {messages.map((message, i) => (
                                        <ChatMessage key={i}
                                                     self={auth.user.id === message.user_id}
                                                     message={message}
                                        />
                                    ))}
                                </div>

                                <form onSubmit={sendMessage}>
                                    <div className="flex gap-4">
                                        <TextInput
                                            ref={messageInputRef}
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="w-full"
                                        />

                                        <PrimaryButton type="submit"
                                                       disabled={!message.length}>Send</PrimaryButton>
                                    </div>

                                    <div>
                                        <InputError message={errors.message} className="mt-2"/>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
