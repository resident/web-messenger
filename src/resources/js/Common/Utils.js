import UserRsaKeysStorage from "@/Common/UserRsaKeysStorage.js";
import UserPassword from "@/Common/UserPassword.js";

export default class Utils {
    static parseQueryString(str) {
        const ret = Object.create(null);

        if (typeof str !== 'string') {
            return ret;
        }

        str = str.trim().replace(/^([?#&])/, '');

        if (!str) {
            return ret;
        }

        str.split('&').forEach((param) => {
            const parts = param.replace(/\+/g, ' ').split('=');
            // Firefox (pre 40) decodes `%3D` to `=`
            // https://github.com/sindresorhus/query-string/pull/37
            let key = parts.shift();
            let val = parts.length > 0 ? parts.join('=') : undefined;

            key = decodeURIComponent(key);

            // missing `=` should be `null`:
            // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
            val = val === undefined ? null : decodeURIComponent(val);

            if (ret[key] === undefined) {
                ret[key] = val;
            } else if (Array.isArray(ret[key])) {
                ret[key].push(val);
            } else {
                ret[key] = [ret[key], val];
            }
        });

        return ret;
    }

    static async getUserPassword() {
        const userRsaKeysStorage = new UserRsaKeysStorage();
        const {privateKey} = userRsaKeysStorage.getKeysFromSession();
        return await UserPassword.getFromSession(privateKey);
    }

    static async setUserPassword(userPassword) {
        const userRsaKeysStorage = new UserRsaKeysStorage();
        const {publicKey} = userRsaKeysStorage.getKeysFromSession();
        return await UserPassword.saveToSession(userPassword, publicKey);
    }
}
