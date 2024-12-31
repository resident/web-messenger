import { useEffect, useState } from 'react';

export default function UserCard({
    user,
    showLastSeen = false,
    showRoleBadge = false,
    roleBadge = '',
    onClick = null,
    className = '',
}) {
    const [isOnline, setIsOnline] = useState(user.is_online || false);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        if (showLastSeen) {
            const interval = setInterval(() => {
                setCurrentDate(new Date());
            }, 1000);

            return () => clearInterval(interval);
        }
    }, []);

    useEffect(() => {
        setIsOnline(!!user.is_online);
    }, [user.is_online]);

    const formatLastSeen = (lastSeenAt) => {
        if (!lastSeenAt) {
            return 'Last seen recently';
        }
        const lastSeenDate = new Date(lastSeenAt + 'Z');
        const diffTime = currentDate - lastSeenDate;
        const diffSeconds = Math.floor(diffTime / 1000);
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        let lastSeenText = '';

        const lastSeenDay = lastSeenDate.getDate();
        const currentDay = currentDate.getDate();
        const lastSeenMonth = lastSeenDate.getMonth();
        const currentMonth = currentDate.getMonth();
        const lastSeenYear = lastSeenDate.getFullYear();
        const currentYear = currentDate.getFullYear();

        if (diffSeconds <= 60) {
            lastSeenText = `Last seen just now`;
        } else if (diffMinutes < 60) {
            lastSeenText = `Last seen ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24 &&
            lastSeenDay === currentDay &&
            lastSeenMonth === currentMonth &&
            lastSeenYear === currentYear) {
            lastSeenText = `Last seen today at ${lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays === 1 ||
            (lastSeenDay !== currentDay &&
                diffHours < 24 &&
                lastSeenMonth === currentMonth &&
                lastSeenYear === currentYear)) {
            lastSeenText = `Last seen yesterday at ${lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            lastSeenText = `Last seen on ${lastSeenDate.toLocaleDateString()}`;
        }

        return lastSeenText;
    };

    const handleClick = () => {
        if (onClick) onClick(user);
    };

    return (
        <div
            className={`${className}
        flex items-center justify-between p-2 rounded hover:bg-gray-100
        ${onClick ? 'cursor-pointer' : ''}
      `}
            onClick={handleClick}
        >
            <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 bg-blue-300 rounded-full overflow-hidden">
                    {user?.avatar?.path && (
                        <img
                            src={`${import.meta.env.VITE_AVATARS_STORAGE}/${user.avatar.path}`}
                            className="absolute inset-0 w-full h-full object-cover"
                            alt="avatar"
                        />
                    )}
                </div>

                <div className="flex flex-col">
                    <div className="font-semibold text-md">{user.name}</div>
                    {showLastSeen && (
                        isOnline ? (
                            <div className="text-sm text-blue-500">Online</div>
                        ) : (
                            <div className="text-sm text-gray-500">{formatLastSeen(user.last_seen_at)}</div>
                        )
                    )}
                </div>
            </div>

            {showRoleBadge && roleBadge && (
                <div className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded capitalize">
                    {roleBadge}
                </div>
            )}
        </div>
    );
}
