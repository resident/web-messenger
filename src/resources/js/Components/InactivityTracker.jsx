import {useCallback, useContext, useEffect} from "react";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";

export default function InactivityTracker() {
    const {
        setUserPublicKey,
        setUserPrivateKey,
        isInactive, setIsInactive
    } = useContext(ApplicationContext);

    const inactivityTimeout = (import.meta.env.VITE_INACTIVITY_TIMEOUT ?? 600) * 1000;

    const resetTimer = useCallback(() => {
        setIsInactive(false);
        clearTimeout(window.inactivityTimer);
        window.inactivityTimer = setTimeout(() => setIsInactive(true), inactivityTimeout);
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('mousedown', resetTimer);
        window.addEventListener('keydown', resetTimer);

        window.inactivityTimer = setTimeout(() => setIsInactive(true), inactivityTimeout);

        return () => {
            clearTimeout(window.inactivityTimer);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('mousedown', resetTimer);
            window.removeEventListener('keydown', resetTimer);
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
