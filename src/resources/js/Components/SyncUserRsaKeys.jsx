import {useContext, useEffect, useState} from "react";
import LoadUserRsaKeys from "@/Components/LoadUserRsaKeys.jsx";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";

export default function SyncUserRsaKeys() {
    const {syncProvider} = useContext(ApplicationContext);
    const [syncedAt, setSyncedAt] = useState(null);

    useEffect(() => {
        const syncedAt = syncProvider.getSyncedAt('userRsaKeys');

        if (syncedAt) {
            setSyncedAt(new Date(syncedAt));
        } else {
            syncProvider.sync('userRsaKeys').then(({syncedAt}) => {
                setSyncedAt(syncedAt);
            });
        }
    }, []);

    return (
        syncedAt && <LoadUserRsaKeys/>
    );
}
