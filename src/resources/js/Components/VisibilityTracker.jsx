import { useContext, useEffect, useState } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";

export default function VisibilityTracker() {
    const {
        pageIsHidden, setPageIsHidden
    } = useContext(ApplicationContext);

    const [prevIsHidden, setPrevIsHidden] = useState(null);

    const onVisibilityChange = () => {
        const isDocumentHidden = document.hidden
        const isWindowBlurred = !document.hasFocus();
        const isHidden = isDocumentHidden || isWindowBlurred;

        if (prevIsHidden !== isHidden) {
            setPageIsHidden(isHidden);
        }
        setPrevIsHidden(isHidden);
    };

    useEffect(() => {
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('blur', onVisibilityChange);
        window.addEventListener('focus', onVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('blur', onVisibilityChange);
            window.removeEventListener('focus', onVisibilityChange);
        }
    }, []);
}
