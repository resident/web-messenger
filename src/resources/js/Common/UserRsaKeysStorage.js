import PBKDF2 from "@/Encryption/PBKDF2.js";

export default class UserRsaKeysStorage {
    hasKeysInSessionStorage() {
        return null !== (sessionStorage.getItem('userPublicKey') && sessionStorage.getItem('userPrivateKey'));
    }

    hasKeysInLocalStorage() {
        return null !== (localStorage.getItem('userPublicKey') && localStorage.getItem('userPrivateKey'));
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

    async saveKeysToLocalStorage(password, publicKey, privateKey) {
        const pbkdf2 = new PBKDF2();

        const encryptedPublicKey = await pbkdf2.encrypt(password, publicKey);

        localStorage.setItem('userPublicKey', JSON.stringify({
            encrypted: encryptedPublicKey.encrypted.toBase64(),
            salt: encryptedPublicKey.salt.toBase64(),
            iv: encryptedPublicKey.iv.toBase64(),
        }));

        const encryptedPrivateKey = await pbkdf2.encrypt(password, privateKey);

        localStorage.setItem('userPrivateKey', JSON.stringify({
            encrypted: encryptedPrivateKey.encrypted.toBase64(),
            salt: encryptedPrivateKey.salt.toBase64(),
            iv: encryptedPrivateKey.iv.toBase64(),
        }));
    }

    async getKeysFromLocalStorage(password) {
        const pbkdf2 = new PBKDF2();

        const encryptedPublicKey = JSON.parse(localStorage.getItem('userPublicKey'));
        const encryptedPrivateKey = JSON.parse(localStorage.getItem('userPrivateKey'));

        const publicKey = await pbkdf2.decrypt(
            password,
            ArrayBuffer.fromBase64(encryptedPublicKey.encrypted),
            Uint8Array.fromBase64(encryptedPublicKey.salt),
            Uint8Array.fromBase64(encryptedPublicKey.iv),
        );

        const privateKey = await pbkdf2.decrypt(
            password,
            ArrayBuffer.fromBase64(encryptedPrivateKey.encrypted),
            Uint8Array.fromBase64(encryptedPrivateKey.salt),
            Uint8Array.fromBase64(encryptedPrivateKey.iv),
        );

        return {publicKey, privateKey};
    }
}
