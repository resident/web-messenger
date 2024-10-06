import {useContext, useEffect, useState} from "react";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";

export default function VisibilityTracker() {
    const {
        pageIsHidden, setPageIsHidden
    } = useContext(ApplicationContext);

    const [prevIsHidden, setPrevIsHidden] = useState(null);

    const onVisibilityChange = () => {
        if (prevIsHidden !== pageIsHidden) {
            setPageIsHidden(document.hidden);
        }

        setPrevIsHidden(document.hidden);
    };

    useEffect(() => {
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
        }
    }, []);
}
