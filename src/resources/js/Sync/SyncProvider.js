export default class SyncProvider {
    #drivers;

    constructor(drivers) {
        this.#drivers = drivers;
    }

    async #process(callback) {
        const results = [];

        for (const driver of this.#drivers) {
            results.push(callback(driver));
        }

        return await Promise.all(results);
    }

    async get(key) {
        return this.#process((driver) => driver.get(key));
    }

    async set(key, value, except = []) {
        return this.#process((driver) => {
            if (!except.length || !except.includes(driver.name)) {
                driver.set(key, value);
            }
        });
    }

    async delete(key) {
        return this.#process((driver) => driver.delete(key));
    }

    getSyncedAt(key) {
        return localStorage.getItem(`${key}SyncedAt`);
    }

    setSyncedAt(key, date = null) {
        localStorage.setItem(`${key}SyncedAt`, (date ?? new Date()).toISOString());
    }

    async sync(key) {
        const items = await this.get(key);

        let freshItem = null;
        let maxUpdatedAt = null;

        for (const item of items) {
            if (item.result === null) {
                continue;
            }

            const updatedAt = new Date(item.result.updated_at)

            if (maxUpdatedAt === null) {
                maxUpdatedAt = updatedAt;
                freshItem = item;
                continue;
            }

            if (updatedAt > maxUpdatedAt) {
                maxUpdatedAt = updatedAt;
                freshItem = item;
            }
        }

        if (maxUpdatedAt !== null) {
            await this.set(key, freshItem.result.value, [freshItem.driverName]);
        }

        const syncedAt = new Date();

        this.setSyncedAt(key, syncedAt);

        return {
            syncedAt,
        };
    }
}
