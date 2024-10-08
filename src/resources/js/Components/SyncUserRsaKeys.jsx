import {useEffect, useState} from "react";
import SyncProvider from "@/Sync/SyncProvider.js";
import LocalStorageDriver from "@/Sync/Drivers/LocalStorageDriver.js";
import BackendDriver from "@/Sync/Drivers/BackendDriver.js";

export default function SyncUserRsaKeys() {
    const [syncedAt, setSyncedAt] = useState(null);

    useEffect(() => {
        const syncedAt = localStorage.getItem('userRsaKeysSyncedAt');

        if (syncedAt) {
            setSyncedAt(new Date(syncedAt));
        } else {
            const syncProvider = new SyncProvider([
                new LocalStorageDriver(),
                new BackendDriver()
            ]);

            syncProvider.sync('userRsaKeys').then(() => {
                const syncedAt = new Date();

                localStorage.setItem('userRsaKeysSyncedAt', syncedAt.toISOString());

                setSyncedAt(syncedAt);
            });
        }
    }, []);
}
