import {createContext, useState} from "react";
import SyncProviderFactory from "@/Sync/SyncProviderFactory.js";

export const ApplicationContext = createContext(null);

export const ApplicationContextProvider = ({children, value}) => {
    const [pageIsHidden, setPageIsHidden] = useState(document.hidden);
    const [syncProvider, setSyncProvider] = useState(
        SyncProviderFactory.makeForAllowedDrivers([
            'LocalStorageDriver',
            'BackendDriver',
            'DropboxDriver',
        ])
    );

    return (
        <ApplicationContext.Provider value={{
            pageIsHidden, setPageIsHidden,
            syncProvider, setSyncProvider,
            ...value
        }}>
            {children}
        </ApplicationContext.Provider>
    );
};
