import { forwardRef, useContext, useEffect, useRef, useState } from "react";
import {
    ArrowPathIcon,
    ArrowUturnRightIcon,
    DocumentDuplicateIcon,
    DocumentIcon,
    TrashIcon
} from '@heroicons/react/24/solid';
import ChatMessageAttachment from "@/Pages/ChatRoom/Partials/ChatMessageAttachment.jsx";
import Modal from "@/Components/Modal.jsx";
import ChatRooms from "@/Pages/ChatRoom/Partials/ChatRooms.jsx";
import ChatRoom from "@/Pages/ChatRoom/Partials/ChatRoom.jsx";
import PrimaryButton from "@/Components/PrimaryButton.jsx";
import SecondaryButton from "@/Components/SecondaryButton.jsx";
import { default as CommonChatRoom } from "@/Common/ChatRoom.js";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";
import ChatRoomMessage from "@/Common/ChatRoomMessage.js";
import { ChatRoomContext } from "@/Pages/ChatRoom/ChatRoomContext.jsx";
import InputError from "@/Components/InputError.jsx";
import { Link } from "@inertiajs/react";
import { CheckIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import CircularProgressBar from "@/Components/CircularProgressBar";
import ContextMenu from "@/Components/ContextMenu";
import CustomScrollArea from "@/Components/CustomScrollArea";

export default forwardRef(function ChatMessage({
    className = '',
    message,
    self = false,
    messageType,
    onMessageRead = () => null,
    onMessageRemoved = () => null,
    isPlaceholder = false,
    errorPending = false,
    uploadProgress = 0,
    onRetrySend = () => null,
    ...props
}, ref) {
    const {
        user,
        userPrivateKey, safeViewIsOn, userIsOnline,
        contextMenuVisible, setContextMenuVisible,
        contextMenuPosition, setContextMenuPosition,
        contextMenuTarget, setContextMenuTarget,
        chatRooms, setChatRooms,
    } = useContext(ApplicationContext);
    const [chatRoom, setChatRoom] = useState(props.chatRoom);
    const { chatRoomKey } = useContext(ChatRoomContext);

    const messageRef = ref ? ref : useRef();
    const observerRef = useRef();

    const [userAvatar, setUserAvatar] = useState(message.user.avatar);
    const [userAvatarPath, setUserAvatarPath] = useState('');
    const [createdAt, setCreatedAt] = useState({});
    const [showForwardingModal, setShowForwardingModal] = useState(false);
    const [forwardToChatRoom, setForwardToChatRoom] = useState(null);
    const [messageForwarding, setMessageForwarding] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [showSeenByModal, setShowSeenByModal] = useState(false);
    const [seenByUsers, setSeenByUsers] = useState([]);

    const [seenSent, setSeenSent] = useState(false);
    const [isLoadingSeenByUsers, setIsLoadingSeenByUsers] = useState(false);
    const [seenByError, setSeenByError] = useState(false);

    const pivot = chatRoom?.users.find(u => u.id === user.id)?.pivot;

    useEffect(() => {
        const avatarsStorage = import.meta.env.VITE_AVATARS_STORAGE;

        if (avatarsStorage && userAvatar) {
            setUserAvatarPath(`${avatarsStorage}/${userAvatar.path}`);
        }
    }, [userAvatar]);

    useEffect(() => {
        const date = new Date(message.created_at);

        setCreatedAt({
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
    }, []);

    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1,
        };

        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    onMessageRead(message);

                    if (self || isPlaceholder || errorPending || (seenSent && message.status === "SEEN") || !userIsOnline) {
                        return;
                    }

                    const createdAtDate = new Date(message.created_at);
                    const currentDate = new Date();

                    const daysDifference = Math.floor((currentDate - createdAtDate) / (1000 * 60 * 60 * 24));
                    //console.log("Message:", { message, seenSent, daysDifference });
                    if (message.status === "SEEN" && daysDifference >= 7) {
                        return;
                    }
                    axios.post(route('chat_rooms.messages.mark_as_seen', {
                        chatRoom: message.chat_room_id,
                        message: message.id,
                    })).then(() => {
                        setSeenSent(true);
                    }).catch(error => {
                    });

                    observer.unobserve(entry.target);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => {
            if (observerRef.current) {
                observer.unobserve(observerRef.current);
            }
        }
    }, [observerRef.current, userIsOnline]);

    const hideMenuContext = () => {
        setContextMenuVisible(false);
        setContextMenuTarget(null);
    };

    const handleContextMenu = (e) => {
        if (showSeenByModal || showForwardingModal) {
            return;
        }
        e.preventDefault();

        if (contextMenuVisible) {
            return;
        }
        hideMenuContext();

        setTimeout(() => {
            setContextMenuPosition({ x: e.clientX, y: e.clientY });
            setContextMenuTarget(message.id);
            setContextMenuVisible(true);
        }, 0);
    };

    const handleCopyMessage = () => {
        navigator.clipboard.writeText(message.message).finally(() => {
            hideMenuContext()
        });
    };

    const handleForwardMessage = () => {
        hideMenuContext();
        setShowForwardingModal(true);
    };

    const canDeleteMessage = () => {
        if (self) return true;
        if (pivot?.permissions?.includes('delete_messages_of_others') || pivot?.role_name === 'owner') return true;
        return false;
    }

    const handleDeleteMessage = () => {
        if (!canDeleteMessage) return;
        hideMenuContext();
        removeMessage();
    };

    const removeMessage = () => {
        if (!canDeleteMessage) return;
        const userConfirmed = confirm('Are you sure?');

        if (!userConfirmed) return;

        if (isPlaceholder && errorPending) {
            onMessageRemoved();
            return;
        }

        axios.delete(route('chat_rooms.messages.destroy', {
            chatRoom: message.chat_room_id,
            message: message.id
        }), {
            headers: {
                'X-Socket-ID': Echo.socketId(),
            }
        }).then(response => {
            if (response.data.isDeleted) {
                onMessageRemoved();
            }
        });
    };

    const forwardMessage = async (toChatRoom) => {
        if (isPlaceholder) {
            return;
        }

        setMessageForwarding(true);

        try {
            const toChatRoomKey = await CommonChatRoom.decryptChatRoomKey(userPrivateKey, toChatRoom.pivot.chat_room_key);

            ChatRoomMessage.forwardMessage(message, toChatRoom, chatRoomKey, toChatRoomKey).then((response) => {
                setSuccess('Message forwarded');

                setTimeout(() => closeMessageForwardingModal(), 2000);
            }).catch(error => {
                setError(error.message);
            });
        } catch (error) {
            setError(error.message);
        }

        setMessageForwarding(false);
    };

    const closeMessageForwardingModal = () => {
        setShowForwardingModal(false);

        setTimeout(() => {
            setError(null);
            setSuccess(null);
            setForwardToChatRoom(null);
        }, 300);
    };

    const handleStatusClick = () => {
        if (!self) {
            setSeenByError("Failed to load data.");
            setShowSeenByModal(true);
            return;
        }
        if (message.status === 'SEEN') {
            hideMenuContext();
            setShowSeenByModal(true);
            setIsLoadingSeenByUsers(true);
            fetchSeenByUsers();
        }
    }

    const fetchSeenByUsers = async () => {
        try {
            const response = await axios.get(
                route('chat_rooms.messages.get_seen_by', {
                    chatRoom: message.chat_room_id,
                    message: message.id
                })
            );
            const sortedData = response.data.sort(
                (a, b) => new Date(b.seen_at) - new Date(a.seen_at)
            );
            setSeenByUsers(sortedData);
        } catch (error) {
            setSeenByError("Failed to load data.");
        } finally {
            setIsLoadingSeenByUsers(false);
        }
    }

    const formatSeenAt = (timestamp) => {
        const date = new Date(timestamp);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    const getMessageClasses = (self, messageType) => {
        let classes = '';

        if (!self) {
            if (messageType === 'top') {
                classes = 'rounded-tr-2xl rounded-br-2xl rounded-tl-2xl rounded-bl';
            } else if (messageType === 'middle') {
                classes = 'rounded-tr-2xl rounded-br-2xl rounded-tl rounded-bl';
            } else if (messageType === 'last') {
                classes = 'rounded-tr-2xl rounded-br-2xl rounded-tl rounded-bl-none';
            } else if (messageType === 'singular') {
                classes = 'rounded-tr-2xl rounded-br-2xl rounded-tl-2xl rounded-bl-none';
            }
        } else {
            if (messageType === 'top') {
                classes = 'rounded-tl-2xl rounded-bl-2xl rounded-tr-2xl rounded-br';
            } else if (messageType === 'middle') {
                classes = 'rounded-tl-2xl rounded-bl-2xl rounded-tr rounded-br';
            } else if (messageType === 'last') {
                classes = 'rounded-tl-2xl rounded-bl-2xl rounded-tr rounded-br-none';
            } else if (messageType === 'singular') {
                classes = 'rounded-tl-2xl rounded-bl-2xl rounded-tr-2xl rounded-br-none';
            }
        }

        return classes;
    };

    const getMessageYPadding = (messageType) => {
        let padding = '';
        if (messageType === 'top') {
            padding = 'pt-[2px] pb-[0.5px]';
        } else if (messageType === 'middle') {
            padding = 'pt-[0.5px] pb-[0.5px]';
        } else if (messageType === 'last') {
            padding = 'pt-[0.5px] pb-[2px]';
        } else if (messageType === 'singular') {
            padding = 'pt-[2px] pb-[2px]';
        }
        return padding;
    }

    const Checkmarks = () => {
        return (
            <div className="relative pr-4">
                <CheckIcon className="text-blue-500 w-4 h-4 absolute top-1/2 left-0 transform -translate-y-1/2" />
                <CheckIcon className="text-blue-500 w-4 h-4 absolute top-1/2 left-1 transform -translate-y-1/2" />
            </div>
        );
    }

    const getMenuOptions = () => {
        const options = [
            {
                label: 'Copy',
                icon: <DocumentDuplicateIcon className="size-4" />,
                onClick: handleCopyMessage,
            },
            ...(errorPending ? [{
                label: 'Retry',
                icon: <ArrowPathIcon className="size-4" />,
                color: 'text-red-500',
                onClick: onRetrySend,
            }] : isPlaceholder ? [] : [{
                label: 'Forward',
                icon: <ArrowUturnRightIcon className="size-4" />,
                onClick: handleForwardMessage,
            }]),
            ...((self && message.status === 'SEEN') ? [{
                label: 'Seen by',
                icon: <Checkmarks />,
                onClick: handleStatusClick,
            }] : []),
            ...(canDeleteMessage() ? [{
                label: 'Delete',
                icon: <TrashIcon className="size-4" />,
                color: 'text-red-500',
                onClick: handleDeleteMessage,
            }] : []),
        ];
        return options;
    };


    return (
        <div
            className="w-full flex flex-col select-none"
            onContextMenu={handleContextMenu}
            onMouseDown={() => window.getSelection().removeAllRanges()}
            onTouchStart={() => window.getSelection().removeAllRanges()}
        >
            {contextMenuVisible && contextMenuTarget === message.id && (
                <ContextMenu
                    options={getMenuOptions()}
                    position={contextMenuPosition}
                    onClose={hideMenuContext}
                />
            )}
            <div
                className={`
                flex w-full flex-col items-end group
                ${self ? 'self-end' : 'self-start'}
                ${className}
            `}
                ref={(el) => {
                    observerRef.current = el;
                    if (ref) {
                        if (typeof ref === 'function') {
                            ref(el);
                        } else {
                            ref.current = el;
                        }
                    }
                }}
            >
                <Modal
                    className={`p-3 w-full sm:max-w-md`}
                    maxWidth="md"
                    show={showForwardingModal}
                    onClose={closeMessageForwardingModal}
                >
                    {forwardToChatRoom && <div>
                        <ChatRoom className={`my-2`} chatRoom={forwardToChatRoom} subscribeToEvents={false} />

                        <InputError message={error} className="my-2" />

                        <div className={`flex gap-2`}>
                            <PrimaryButton disabled={messageForwarding}
                                onClick={() => forwardMessage(forwardToChatRoom)}
                            >Forward</PrimaryButton>

                            <SecondaryButton onClick={closeMessageForwardingModal}>Cancel</SecondaryButton>
                        </div>

                        {success && <div className={`mt-2 text-green-600`}>{success}</div>}
                    </div> || <CustomScrollArea className="h-96">
                            <ChatRooms
                                onChatRoomClick={chatRoom => {
                                    setForwardToChatRoom(chatRoom);
                                }}
                                subscribeToEvents={false}
                            />
                        </CustomScrollArea>
                    }
                </Modal>

                <Modal
                    className={`p-3 !pb-2 w-full sm:max-w-md`}
                    maxWidth="md"
                    show={showSeenByModal}
                    onClose={() => setShowSeenByModal(false)}
                >
                    <div className="p-4 !pb-0">
                        <h2 className="text-lg font-semibold mb-4">Seen by</h2>
                        <hr />
                        <CustomScrollArea className="mt-4 h-64 sm:h-80">
                            {isLoadingSeenByUsers ? (
                                <div className="space-y-4 mt-1">
                                    {[...Array(3)].map((_, index) => (
                                        <div key={index} className="flex items-center space-x-4 animate-pulse">
                                            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                                            <div className="flex-1 space-y-2 w-40">
                                                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : seenByError ? (
                                <div className="text-red-500">{seenByError}</div>
                            ) : seenByUsers.length > 0 ? (
                                seenByUsers.map((user) => (
                                    <div key={user.id} className="flex items-center mb-2">
                                        <div className="w-12 h-12 mr-3 bg-[#073666] rounded-full overflow-hidden">
                                            {user.avatar &&
                                                (
                                                    <img
                                                        src={`${import.meta.env.VITE_AVATARS_STORAGE}/${user.avatar.path}`}
                                                        alt="avatar"
                                                        className="w-full h-full object-cover" />
                                                )}
                                        </div>
                                        <div>
                                            <div
                                                className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">{user.name}</div>
                                            <div className="text-xs text-gray-500 flex gap-x-1">
                                                <svg
                                                    fill="#3B82F6"
                                                    className="h-4 stroke-3 ml-1"
                                                    viewBox="2 1 21 21"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M6.54591047,14.1998821 L14.6192054,6 L16,7.40005893 L6.54591047,17 L1.97366706,12.3500147 L3.35446166,10.9499558 L6.54591047,14.1998821 Z"
                                                    />
                                                    <path
                                                        d="M10.6664523,15.0943204 L12.0462428,13.6932433 L12.5459105,14.1998821 L20.6192054,6 L22,7.40005893 L12.5459105,17 L10.6664523,15.0943204 Z"
                                                    />
                                                </svg>
                                                <span className="">{formatSeenAt(user.seen_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div>No data</div>
                            )}
                        </CustomScrollArea>
                        <hr />
                        <div className="flex justify-end pr-3 pt-2">
                            <button
                                className="text-blue-500 bg-transparent hover:bg-blue-100 font-semibold py-2 px-4 rounded"
                                onClick={() => setShowSeenByModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>


                {!self && (messageType === 'top' || messageType === 'singular') && (
                    <div className="flex flex-1 pl-1 group self-start items-end">
                        <div className="min-w-12 mr-3 hidden sm:block"></div>
                        <div className="flex ml-3 items-center space-x-2 mt-1">
                            <div className={`
                            font-bold overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]
                            ${errorPending ? 'text-red-700' : 'text-[#073666]'}
                            `}>
                                <Link href={route('user-profile.show', message.user.id)}>{message.user.name}</Link>
                            </div>
                            <div className="size-1.5 rounded-full bg-[#073666]"></div>
                            <span className="text-[#57728E] text-xs">{createdAt.time}</span>
                        </div>
                    </div>
                )}

                <div
                    className={`flex flex-1 ${self ? 'flex-row-reverse' : ''} w-full pl-4 pr-3 ${getMessageYPadding(messageType)} group items-end
                    transition-colors duration-100 ease-in-out
                    ${contextMenuVisible && contextMenuTarget === message.id ? self ? 'bg-black bg-opacity-10 rounded-l-lg' : 'bg-black bg-opacity-10 rounded-r-lg' : ''}`}
                >
                    <div
                        className={`
                            relative size-11 ${self ? 'ml-3' : 'mr-3'} 
                            ${errorPending ? 'bg-red-300' : (self ? 'bg-[#2889EE]' : 'bg-[#073666]')}
                            rounded-full overflow-hidden
                            hidden sm:block transform-gpu transition-all duration-300
                            ${(messageType === 'last' || messageType === 'singular')
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 -translate-y-[-100%] pointer-events-none'
                            }
                        `}
                    >
                        {message.user.avatar &&
                            (<img src={`${import.meta.env.VITE_AVATARS_STORAGE}/${message.user.avatar.path}`}
                                alt="avatar"
                                className="absolute inset-0 w-full h-full object-cover" />
                            )
                        }
                    </div>
                    <div className={`
                        pt-3 pl-3 pr-1 break-words max-w-sm sm:max-w-md min-w-[150px]
                        ${errorPending ? 'bg-red-300' : (self ? 'bg-[#2889EE]' : 'bg-[#073666]')}
                        ${getMessageClasses(self, messageType)}
                    `}>

                        <div className={`${safeViewIsOn && 'blur-sm group-hover:blur-0'} pr-4 text-white select-text`}>
                            {message.message}
                        </div>

                        {message.attachments?.length > 0 &&
                            <div className={`flex flex-wrap my-2 ${safeViewIsOn && 'blur-lg group-hover:blur-0'}`}>
                                {isPlaceholder ? (
                                    <div
                                        className={`relative ${errorPending ? 'bg-red-100' : 'bg-blue-100'} rounded-md p-4 flex items-center w-full`}>
                                        <DocumentIcon className="w-6 h-6 text-gray-500 mr-2" />
                                        <span className="text-gray-700 mr-2">Attachments...</span>
                                        <div
                                            className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
                                            {errorPending ? (
                                                <ExclamationCircleIcon className="w-6 h-6" />
                                            ) : (
                                                <CircularProgressBar className="w-6 h-6" progress={uploadProgress}
                                                    size={24} strokeWidth={4} />
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    message.attachments.map((attachment, i) => (
                                        <ChatMessageAttachment key={i} attachment={attachment} />
                                    ))
                                )}
                            </div>
                        }

                        <div className={`
                    text-xs font-light text-right flex items-center justify-end min-h-4 min-w-1 -mt-[3px] mb-1
                    ${self ? (errorPending ? 'text-red-700' : 'text-[#E7E9ED] ') : 'text-[#E7E9ED]'}
                `}>
                            {(self || (!self && messageType !== 'top' && messageType !== 'singular')) && (
                                <div className={!self ? "mr-2" : ""}>
                                    <span>{createdAt.time}</span>
                                </div>
                            )}
                            {self && (
                                errorPending ? (
                                    <div className="ml-1">
                                        <ArrowPathIcon
                                            className="text-red-500 w-4 h-4 ml-1 cursor-pointer"
                                            onClick={onRetrySend}
                                            title="Retry sending"
                                        />
                                    </div>
                                ) : isPlaceholder ? (
                                    <div
                                        className="w-4 h-4 ml-2 border-2 border-t-transparent border-l-transparent border-gray-800 rounded-full animate-spin"></div>
                                ) : (
                                    <div
                                        className={`${message.status === 'SEEN' ? 'mr-0.5 cursor-pointer' : ''} ml-1 h-4`}
                                        onClick={handleStatusClick}
                                    >
                                        <svg
                                            fill="#E7E9ED"
                                            className="h-4 stroke-3"
                                            viewBox={`${message.status === 'SEEN' ? '2 1 21 21' : '0 1 21 21'}`}
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M6.54591047,14.1998821 L14.6192054,6 L16,7.40005893 L6.54591047,17 L1.97366706,12.3500147 L3.35446166,10.9499558 L6.54591047,14.1998821 Z"
                                            />
                                            {message.status === 'SEEN' ? (
                                                <path
                                                    d="M10.6664523,15.0943204 L12.0462428,13.6932433 L12.5459105,14.1998821 L20.6192054,6 L22,7.40005893 L12.5459105,17 L10.6664523,15.0943204 Z"
                                                />
                                            ) : null}

                                        </svg>

                                    </div>
                                ))}
                        </div>
                    </div>
                </div>


            </div>
        </div>
    )
});
