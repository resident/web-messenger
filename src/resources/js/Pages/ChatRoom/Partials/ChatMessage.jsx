import {forwardRef, useEffect, useRef, useState} from "react";
import {TrashIcon} from '@heroicons/react/24/solid'
import ChatMessageAttachmentAttachment from "@/Pages/ChatRoom/Partials/ChatMessageAttachment.jsx";

export default forwardRef(function ChatMessage({
                                                   className = '',
                                                   message,
                                                   self = false,
                                                   onMessageRemoved,
                                                   ...props
                                               }, ref) {
    const messageRef = ref ? ref : useRef();

    const [createdAt, setCreatedAt] = useState({});

    useEffect(() => {
        const [date, time] = message.created_at.split(' ');
        const [hours, minutes] = time.split(':');

        setCreatedAt({
            date,
            time: `${hours}:${minutes}`,
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

    return (
        <div
            className={`
                first:mt-auto max-w-xl rounded-md p-3 break-words group
                ${self ? 'bg-lime-300 self-end ' : 'bg-yellow-300 self-start '}
                ${className}
            `}
            ref={messageRef}
        >
            <div className={`flex justify-between`}>
                <div className={`
                    font-bold
                    ${self ? 'text-lime-700 ' : 'text-yellow-700 '}
                `}>{message.user.name}</div>

                <div>
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
                <div className={`flex flex-wrap mt-2`}>
                    {message.attachments.map((attachment, i) => (
                        <ChatMessageAttachmentAttachment key={i} attachment={attachment}/>
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
    )
});
