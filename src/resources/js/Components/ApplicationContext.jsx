import {createContext} from "react";

export const ApplicationContext = createContext(null);

export const ApplicationContextProvider = ({children, value}) => {
    return (
        <ApplicationContext.Provider value={value}>
            {children}
        </ApplicationContext.Provider>
    );
};
