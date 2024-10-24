import { useCallback, useContext, useEffect } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";

export default function InactivityTracker() {
    const {
        setUserPublicKey,
        setUserPrivateKey,
        isInactive, setIsInactive,
        setIsInactiveNow
    } = useContext(ApplicationContext);

    const inactivityTimeout = (import.meta.env.VITE_INACTIVITY_TIMEOUT ?? 600) * 1000;
    const inactivityNowTimeout = 60 * 1000;

    const resetTimer = useCallback(() => {
        setIsInactive(false);
        setIsInactiveNow(false);

        clearTimeout(window.inactivityTimer);
        clearTimeout(window.inactivityNowTimer);

        window.inactivityTimer = setTimeout(() => setIsInactive(true), inactivityTimeout);
        window.inactivityNowTimer = setTimeout(() => setIsInactiveNow(true), inactivityNowTimeout);

    }, []);

    useEffect(() => {
        const desktopEvents = ['mousemove', 'mousedown', 'keydown', 'scroll'];
        const mobileEvents = ['touchstart', 'touchmove', 'touchend'];
        const allEvents = [...desktopEvents, ...mobileEvents];
        allEvents.forEach(event => window.addEventListener(event, resetTimer));

        window.inactivityTimer = setTimeout(() => setIsInactive(true), inactivityTimeout);
        window.inactivityNowTimer = setTimeout(() => setIsInactiveNow(true), inactivityNowTimeout);

        return () => {
            clearTimeout(window.inactivityTimer);
            clearTimeout(window.inactivityNowTimer);

            allEvents.forEach(event => window.removeEventListener(event, resetTimer));
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
