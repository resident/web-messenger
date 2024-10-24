import { useContext, useEffect, useRef } from "react";
import { usePage } from '@inertiajs/react';
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";

export default function UserStatusTracker() {
    const {
        isInactive,
        isInactiveNow,
        sessionLocked,
        pageIsHidden,
    } = useContext(ApplicationContext);

    const userId = usePage().props.auth.user.id;

    const isConnectedRef = useRef(false);

    useEffect(() => {
        const shouldBeOnline = !isInactive && !sessionLocked && !pageIsHidden && !isInactiveNow;
        if (shouldBeOnline && !isConnectedRef.current) {
            Echo.private(`user-status.${userId}`);
            isConnectedRef.current = true;
        } else if (!shouldBeOnline && isConnectedRef.current) {
            Echo.leave(`user-status.${userId}`);
            isConnectedRef.current = false;
        }
    }, [isInactive, sessionLocked, pageIsHidden, isInactiveNow]);
}
