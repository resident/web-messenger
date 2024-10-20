import {forwardRef, useEffect, useRef, useState} from "react";
import {ArrowUturnRightIcon, TrashIcon} from '@heroicons/react/24/solid'
import ChatMessageAttachment from "@/Pages/ChatRoom/Partials/ChatMessageAttachment.jsx";
import Modal from "@/Components/Modal.jsx";
import ChatRooms from "@/Pages/ChatRoom/Partials/ChatRooms.jsx";
import ChatRoom from "@/Pages/ChatRoom/Partials/ChatRoom.jsx";
import PrimaryButton from "@/Components/PrimaryButton.jsx";
import SecondaryButton from "@/Components/SecondaryButton.jsx";

export default forwardRef(function ChatMessage({
                                                   className = '',
                                                   message,
                                                   self = false,
                                                   onMessageRemoved,
                                                   ...props
                                               }, ref) {
    const messageRef = ref ? ref : useRef();

    const [createdAt, setCreatedAt] = useState({});
    const [showForwardingModal, setShowForwardingModal] = useState(false);
    const [forwardToChatRoom, setForwardToChatRoom] = useState(null);

    useEffect(() => {
        const date = new Date(message.created_at);

        setCreatedAt({
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
        });
    }, []);

    const removeMessage = () => {
        const userConfirmed = confirm('Are you sure?');

        if (!userConfirmed) return;

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

    const forwardMessage = (toChatRoom) => {
        //todo Implement message forwarding

        closeMessageForwardingModal();
    };

    const closeMessageForwardingModal = () => {
        setShowForwardingModal(false);

        setTimeout(() => setForwardToChatRoom(null), 300);
    };

    return (
        <div
            className={`
                first:mt-auto flex items-end max-w-xl group
                ${self ? 'self-end' : 'self-start'}
                ${className}
            `}
            ref={messageRef}
        >
            <Modal
                className={`p-3`}
                maxWidth="md"
                show={showForwardingModal}
                onClose={closeMessageForwardingModal}
            >
                {forwardToChatRoom && <div>
                    <ChatRoom className={`my-2`} chatRoom={forwardToChatRoom}/>

                    <div className={`flex gap-2`}>
                        <PrimaryButton onClick={() => forwardMessage(forwardToChatRoom)}>Forward</PrimaryButton>

                        <SecondaryButton onClick={closeMessageForwardingModal}>Cancel</SecondaryButton>
                    </div>
                </div> || <ChatRooms
                    onChatRoomClick={chatRoom => {
                        setForwardToChatRoom(chatRoom);
                    }}/>
                }
            </Modal>

            <div className={`w-12 h-12 mr-3 ${self ? 'bg-lime-300' : 'bg-yellow-300'} rounded-full`}></div>

            <div className={`
                rounded-md p-3 break-words
                ${self ? 'bg-lime-300' : 'bg-yellow-300'}
            `}>
                <div className={`flex justify-between`}>
                    <div className={`
                    font-bold
                    ${self ? 'text-lime-700 ' : 'text-yellow-700 '}
                `}>{message.user.name}</div>

                    <div className={`flex gap-0.5`}>
                        <ArrowUturnRightIcon
                            className={`
                            size-4 opacity-0 group-hover:opacity-100 cursor-pointer
                            ${self ? 'text-lime-500 hover:text-lime-700 ' : 'text-yellow-500 hover:text-yellow-700 '}
                        `}
                            onClick={() => setShowForwardingModal(true)}
                        />
                        <TrashIcon
                            className={`
                            size-4 opacity-0 group-hover:opacity-100 cursor-pointer
                            ${self ? 'text-lime-500 hover:text-lime-700 ' : 'text-yellow-500 hover:text-yellow-700 '}
                        `}
                            onClick={removeMessage}
                        />
                    </div>
                </div>

                <div>{message.message}</div>

                {message.attachments.length > 0 &&
                    <div className={`flex flex-wrap my-2`}>
                        {message.attachments.map((attachment, i) => (
                            <ChatMessageAttachment key={i} attachment={attachment}/>
                        ))}
                    </div>
                }

                <div className={`
                    text-xs font-light text-right
                    ${self ? 'text-lime-700 ' : 'text-yellow-700 '}
                `}>
                    <span className={`opacity-0 group-hover:opacity-100 mr-1`}>{createdAt.date}</span>
                    <span>{createdAt.time}</span>
                </div>
            </div>
        </div>
    )
});
