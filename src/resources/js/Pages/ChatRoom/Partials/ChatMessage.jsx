import {forwardRef, useEffect, useRef, useState} from "react";
import {TrashIcon} from '@heroicons/react/24/solid'
import ChatMessageAttachment from "@/Pages/ChatRoom/Partials/ChatMessageAttachment.jsx";

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

    return (
        <div
            className={`
                first:mt-auto flex items-end max-w-xl group
                ${self ? 'self-end' : 'self-start'}
                ${className}
            `}
            ref={messageRef}
        >
            <div className={`w-12 h-12 mr-3 ${self ? 'bg-lime-300' : 'bg-yellow-300'} rounded-full overflow-hidden`}>
                <img src={ message.user.avatar && `${import.meta.env.VITE_AVATARS_STORAGE}/${message.user.avatar.path}`} 
                    alt="avatar"
                    className="w-full h-full object-cover" />
            </div>
                
            <div className={`
                rounded-md p-3 break-words
                ${self ? 'bg-lime-300' : 'bg-yellow-300'}
            `}>
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
