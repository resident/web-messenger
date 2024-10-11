import {useEffect, useState} from "react";
import SyncProvider from "@/Sync/SyncProvider.js";
import LocalStorageDriver from "@/Sync/Drivers/LocalStorageDriver.js";
import BackendDriver from "@/Sync/Drivers/BackendDriver.js";
import DropboxDriver from "@/Sync/Drivers/DropboxDriver";

export default function SyncUserRsaKeys() {
    const [syncedAt, setSyncedAt] = useState(null);

    useEffect(() => {
        const dropboxAccessToken = localStorage.getItem('dropbox_accessToken');
        
        const drivers = [
            new LocalStorageDriver(),
            new BackendDriver(),
        ];

        if (dropboxAccessToken) {
            drivers.push(new DropboxDriver());
        }

        const syncProvider = new SyncProvider(drivers);

        const syncedAt = syncProvider.getSyncedAt('userRsaKeys');

        if (syncedAt) {
            setSyncedAt(new Date(syncedAt));
        } else {
            syncProvider.sync('userRsaKeys').then(({syncedAt}) => {
                setSyncedAt(syncedAt);
            });
        }
    }, []);
}
