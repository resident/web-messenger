import {useContext, useEffect, useState} from "react";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";
import LoadUserRsaKeys from "@/Components/LoadUserRsaKeys.jsx";

export default function DropboxSync() {

    const {syncProvider} = useContext(ApplicationContext);
    const [syncedAt, setSyncedAt] = useState(null);

    useEffect(() => {
        syncProvider.sync('userRsaKeys').then(({syncedAt}) => {
            setSyncedAt(syncedAt);
        });
    }, []);

    return (
        syncedAt && <LoadUserRsaKeys/>
    );
}
