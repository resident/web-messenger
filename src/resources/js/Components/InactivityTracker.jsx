import { useCallback, useContext, useEffect, useRef } from "react";
import { usePage } from '@inertiajs/react';
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";

export default function InactivityTracker() {
    const {
        setUserPublicKey,
        setUserPrivateKey,
        isInactive, setIsInactive,
        sessionLocked, pageIsHidden,
    } = useContext(ApplicationContext);

    const userId = usePage().props.auth.user.id;

    const inactivityTimeout = (import.meta.env.VITE_INACTIVITY_TIMEOUT ?? 600) * 1000;

    const isConnectedRef = useRef(false);

    const resetTimer = useCallback(() => {
        setIsInactive(false);
        clearTimeout(window.inactivityTimer);
        window.inactivityTimer = setTimeout(() => setIsInactive(true), inactivityTimeout);
    }, []);

    useEffect(() => {
        const desktopEvents = ['mousemove', 'mousedown', 'keydown', 'scroll'];
        const mobileEvents = ['touchstart', 'touchmove', 'touchend'];
        desktopEvents.forEach(event => window.addEventListener(event, resetTimer));
        mobileEvents.forEach(event => window.addEventListener(event, resetTimer));

        window.inactivityTimer = setTimeout(() => setIsInactive(true), inactivityTimeout);

        return () => {
            clearTimeout(window.inactivityTimer);

            desktopEvents.forEach(event => window.removeEventListener(event, resetTimer));
            mobileEvents.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [resetTimer]);

    useEffect(() => {
        const shouldBeOnline = !isInactive && !sessionLocked && !pageIsHidden;

        if (shouldBeOnline && !isConnectedRef.current) {
            Echo.private(`user-status.${userId}`);
            isConnectedRef.current = true;
        } else if (!shouldBeOnline && isConnectedRef.current) {
            Echo.leave(`user-status.${userId}`);
            isConnectedRef.current = false;
        }

        if (isInactive) {
            sessionStorage.clear();

            setUserPublicKey(null);
            setUserPrivateKey(null);
        }
    }, [isInactive, sessionLocked, pageIsHidden]);
}
