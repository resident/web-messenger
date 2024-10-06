import {createContext, useState} from "react";

export const ApplicationContext = createContext(null);

export const ApplicationContextProvider = ({children, value}) => {
    const [pageIsHidden, setPageIsHidden] = useState(document.hidden);

    return (
        <ApplicationContext.Provider value={{
            pageIsHidden, setPageIsHidden,
            ...value
        }}>
            {children}
        </ApplicationContext.Provider>
    );
};
