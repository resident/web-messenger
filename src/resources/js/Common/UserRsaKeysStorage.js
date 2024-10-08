import PBKDF2 from "@/Encryption/PBKDF2.js";
import BackendStorage from "@/Common/BackendStorage.js";

export default class UserRsaKeysStorage {
    hasKeysInSessionStorage() {
        return null !== (sessionStorage.getItem('userPublicKey') && sessionStorage.getItem('userPrivateKey'));
    }

    hasKeysInLocalStorage() {
        return null !== localStorage.getItem('userRsaKeys');
    }

    saveKeysToSessionStorage(publicKey, privateKey) {
        sessionStorage.setItem('userPublicKey', publicKey);
        sessionStorage.setItem('userPrivateKey', privateKey);
    }

    getKeysFromSession() {
        const publicKey = sessionStorage.getItem('userPublicKey');
        const privateKey = sessionStorage.getItem('userPrivateKey');

        if (!publicKey) {
            throw new Error('User public key not found!');
        }

        if (!privateKey) {
            throw new Error('User private key not found!');
        }

        return {publicKey, privateKey};
    }

    async encryptKeys(password, {publicKey, privateKey}) {
        const pbkdf2 = new PBKDF2();

        const encryptedPublicKey = await pbkdf2.encrypt(password, publicKey);
        const encryptedPrivateKey = await pbkdf2.encrypt(password, privateKey);

        return {encryptedPublicKey, encryptedPrivateKey};
    }

    async decryptKeys(password, {encryptedPublicKey, encryptedPrivateKey}) {
        const pbkdf2 = new PBKDF2();

        const publicKey = await pbkdf2.decrypt(password, encryptedPublicKey);
        const privateKey = await pbkdf2.decrypt(password, encryptedPrivateKey);

        return {publicKey, privateKey};
    }

    async saveKeysToLocalStorage(password, {publicKey, privateKey}) {
        const currentDate = new Date();

        const userRsaKeys = {
            value: await this.encryptKeys(password, {publicKey, privateKey}),
            created_at: currentDate.toISOString(),
            updated_at: currentDate.toISOString(),
        };

        localStorage.setItem('userRsaKeys', JSON.stringify(userRsaKeys));
    }

    async getKeysFromLocalStorage(password) {
        const userRsaKeys = JSON.parse(localStorage.getItem('userRsaKeys'));

        return await this.decryptKeys(password, {
            encryptedPublicKey: userRsaKeys.value.encryptedPublicKey,
            encryptedPrivateKey: userRsaKeys.value.encryptedPrivateKey,
        });

    }

    async saveKeysToBackend(password, {publicKey, privateKey}) {
        const bs = new BackendStorage();

        return bs.setByKey('userRsaKeys', JSON.stringify(
            await this.encryptKeys(password, {publicKey, privateKey}))
        );
    }

    async getKeysFromBackend(password) {
        const bs = new BackendStorage();

        const response = await bs.getByKey('userRsaKeys');

        const encryptedKeys = response.data.value;

        return this.decryptKeys(password, encryptedKeys);
    }
}
