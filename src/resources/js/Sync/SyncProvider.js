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

    async set(key, value) {
        return this.#process((driver) => driver.set(key, value));
    }

    async delete(key) {
        return this.#process((driver) => driver.delete(key));
    }

    async sync(key) {
        const items = await this.get(key);

        let freshValue = null;
        let maxUpdatedAt = null;

        for (const item of items) {
            if (item.result === null) {
                continue;
            }

            const updatedAt = new Date(item.result.updated_at)

            if (maxUpdatedAt === null) {
                maxUpdatedAt = updatedAt;
                freshValue = item.result.value;
                continue;
            }

            if (updatedAt > maxUpdatedAt) {
                maxUpdatedAt = updatedAt;
                freshValue = item.result.value;
            }
        }

        if (maxUpdatedAt !== null) {
            await this.set(key, freshValue);
        }

    }
}
