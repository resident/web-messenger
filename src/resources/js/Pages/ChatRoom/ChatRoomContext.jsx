import {createContext} from "react";

export const ChatRoomContext = createContext(null);

export const ChatRoomContextProvider = ({children, value}) => {
    return (
        <ChatRoomContext.Provider value={value}>
            {children}
        </ChatRoomContext.Provider>
    );
};
