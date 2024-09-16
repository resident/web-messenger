import {useEffect, useState} from "react";

export default function ChatMessage({className = '', message, self = false, ...props}) {
    const [createdAt, setCreatedAt] = useState({});

    useEffect(() => {
        const [date, time] = message.created_at.split(' ');
        const [hours, minutes] = time.split(':');

        setCreatedAt({
            date,
            time: `${hours}:${minutes}`,
        });
    }, []);

    return (
        <div
            className={`
                first:mt-auto max-w-xl rounded-md p-3 break-words group
                ${self ? 'bg-lime-300 self-end ' : 'bg-yellow-300 self-start '}
                ${className}
            `}
        >
            <div className={`
                font-bold
                ${self ? 'text-lime-700 ' : 'text-yellow-700 '}
            `}>{message.user.name}</div>

            <div>{message.message}</div>

            <div className={`
                text-xs font-light text-right
                ${self ? 'text-lime-700 ' : 'text-yellow-700 '}
            `}>
                <span className={`opacity-0 group-hover:opacity-100 mr-1`}>{createdAt.date}</span>
                <span>{createdAt.time}</span>
            </div>
        </div>
    )
}
