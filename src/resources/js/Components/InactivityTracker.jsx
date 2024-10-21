import { useCallback, useContext, useEffect } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";

export default function InactivityTracker() {
    const {
        setUserPublicKey,
        setUserPrivateKey,
        isInactive, setIsInactive,
    } = useContext(ApplicationContext);

    const inactivityTimeout = (import.meta.env.VITE_INACTIVITY_TIMEOUT ?? 600) * 1000;

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
        if (isInactive) {
            sessionStorage.clear();

            setUserPublicKey(null);
            setUserPrivateKey(null);
        }
    }, [isInactive]);
}
