import DriverResponse from "@/Sync/Drivers/DriverResponse.js";

export default class DriverBase {
    name = 'base';

    response(result, mapper = null) {
        return DriverResponse.make(this.name, result, mapper);
    }

    async get(key) {
        throw new Error('Logic error: Not implemented method get(key)');
    }

    async set(key, value) {
        throw new Error('Logic error: Not implemented method set(key, value)');
    }

    async delete(key) {
        throw new Error('Logic error: Not implemented method delete(key)');
    }
}
