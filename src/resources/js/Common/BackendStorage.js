export default class BackendStorage {
    async getAll() {
        return axios.get(route('backend-storage.index'));
    }

    async create(key, value) {
        return axios.post(route('backend-storage.store'), {key, value});
    }

    async getById(id) {
        return axios.get(route('backend-storage.show', id));
    }

    async getByKey(key) {
        return axios.get(route('backend-storage.show-key', key));
    }

    async setById(id, value) {
        return axios.put(route('backend-storage.update', id), {value});
    }

    async setByKey(key, value) {
        return axios.put(route('backend-storage.update-key', key), {value});
    }

    async deleteById(id) {
        return axios.delete(route('backend-storage.destroy', id));
    }

    async deleteByKey(key) {
        return axios.delete(route('backend-storage.destroy-key', key));
    }
}
