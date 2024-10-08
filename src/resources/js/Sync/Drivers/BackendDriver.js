import DriverBase from "@/Sync/Drivers/DriverBase.js";
import BackendStorage from "@/Common/BackendStorage.js";

export default class BackendDriver extends DriverBase {
    name = "BackendDriver";

    async get(key) {
        const bs = new BackendStorage();

        return this.response(bs.getByKey(key), result => ({
            key,
            value: result.data.value,
            created_at: result.data.created_at,
            updated_at: result.data.updated_at,
        }));
    }

    async set(key, value) {
        const bs = new BackendStorage();

        return this.response(bs.setByKey(key, value), result => result.data);
    }

    async delete(key) {
        const bs = new BackendStorage();

        return this.response(bs.deleteByKey(key), result => result.data);
    }
}
