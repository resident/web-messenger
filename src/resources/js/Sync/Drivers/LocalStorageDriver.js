import DriverBase from "@/Sync/Drivers/DriverBase.js";

export default class LocalStorageDriver extends DriverBase {
    name = "LocalStorageDriver";

    async get(key) {
        const result = new Promise((resolve) => {
            resolve(JSON.parse(localStorage.getItem(key)));
        });

        return this.response(result, result => (result ? {key, ...result} : null));
    }

    async set(key, value) {
        const result = new Promise((resolve) => {
            const currentItem = JSON.parse(localStorage.getItem(key));

            const currentDate = new Date();

            const item = {
                value,
                created_at: currentItem?.created_at ?? currentDate.toISOString(),
                updated_at: currentDate.toISOString(),
            };

            localStorage.setItem(key, JSON.stringify(item));

            resolve(true);
        });

        return this.response(result);
    }

    async delete(key) {
        const result = new Promise((resolve) => {
            localStorage.removeItem(key);

            resolve(true);
        });

        return this.response(result);
    }
}
