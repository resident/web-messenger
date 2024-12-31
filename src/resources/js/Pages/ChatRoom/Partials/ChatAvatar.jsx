import { useEffect, useState, useMemo } from "react";

export default function ChatAvatar({
    users = [],
    lastMessage = null,
    localUser = null,
    size = 'full',
    showOnlineBadgeForSecondUser = false,
}) {
    const [otherUser, setOtherUser] = useState(null);

    useEffect(() => {
        if (users.length === 2 && localUser) {
            const ou = users.find(u => u.id !== localUser.id);
            setOtherUser(ou);
        } else {
            setOtherUser(null);
        }
    }, [users, localUser]);

    const getCollageAvatars = useMemo(() => {
        if (users.length <= 2) return [];

        let prioritizedUser = null;
        if (lastMessage?.user_id) {
            const found = users.find(
                (u) => u.id === lastMessage.user_id && u.avatar?.path
            );
            if (found) {
                prioritizedUser = found;
            }
        }

        let withAvatars = users.filter((u) => !!u.avatar?.path);
        if (prioritizedUser) {
            withAvatars = withAvatars.filter((u) => u.id !== prioritizedUser.id);
            withAvatars.unshift(prioritizedUser);
        }
        return withAvatars.slice(0, 3);
    }, [users, lastMessage]);

    const renderCollage = () => {
        const collage = getCollageAvatars;
        const count = collage.length;
        if (count === 0) {
            return null;
        }
        if (users.length > 2 && count === 1) {
            return (
                <div className={`relative bg-blue-300 rounded-full overflow-hidden w-${size} h-${size}`}>
                    <img
                        src={`${import.meta.env.VITE_AVATARS_STORAGE}/${collage[0].avatar.path}`}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>
            );
        }
        return (
            <div className={`relative bg-blue-300 rounded-full overflow-hidden w-${size} h-${size}`}>
                <div className="w-full h-full relative">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 z-0" />
                    <div className="absolute left-0 top-0 w-1/2 h-full">
                        <img
                            src={`${import.meta.env.VITE_AVATARS_STORAGE}/${collage[0].avatar.path}`}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute left-1/2 top-0 w-1/2 h-full flex flex-col items-center justify-evenly">
                        {count > 1 &&
                            collage.slice(1).map((u) => (
                                <img
                                    key={u.id}
                                    src={`${import.meta.env.VITE_AVATARS_STORAGE}/${u.avatar.path}`}
                                    className="w-full h-full object-cover aspect-square"
                                />
                            ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderSingleOrPair = () => {
        const target = users.length === 1 ? users[0] : otherUser;
        if (!target) return null;

        if (!target.avatar?.path) {
            return null;
        }
        return (
            <>
                <div className={`relative bg-blue-300 rounded-full overflow-hidden w-${size} h-${size}`}>
                    <img
                        src={`${import.meta.env.VITE_AVATARS_STORAGE}/${target.avatar.path}`}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>
                {users.length === 2 && otherUser && showOnlineBadgeForSecondUser && (
                    <span
                        className={`absolute top-0 right-0 size-2 rounded-full bg-blue-500 ring-white ring-2`}
                    />
                )}
            </>
        );
    };

    return (
        <>
            {users.length <= 2 ? renderSingleOrPair() : renderCollage()}
        </>
    );
}
