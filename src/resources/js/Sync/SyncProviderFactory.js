import LocalStorageDriver from "@/Sync/Drivers/LocalStorageDriver.js";
import BackendDriver from "@/Sync/Drivers/BackendDriver.js";
import DropboxDriver from "@/Sync/Drivers/DropboxDriver.js";
import SyncProvider from "@/Sync/SyncProvider.js";
import Dropbox from "@/Common/Dropbox.js";

export default class SyncProviderFactory {
    static getAllDrivers() {
        return [
            new LocalStorageDriver(),
            new BackendDriver(),
            new DropboxDriver(),
        ];
    }

    static makeForAllowedDrivers(allowedDriverNames = []) {
        const allDrivers = this.getAllDrivers();
        const allowedDrivers = [];

        if (allowedDriverNames.includes('DropboxDriver') && new Dropbox().getSetting('accessToken') === null) {
            allowedDriverNames = allowedDriverNames.filter(driver => driver !== 'DropboxDriver');
        }

        for (const driver of allDrivers) {
            if (allowedDriverNames.includes(driver.name)) {
                allowedDrivers.push(driver);
            }
        }

        return new SyncProvider(allowedDrivers);
    }
}
