import RSAEncryptor from "@/Encryption/RSAEncryptor.js";

export default class UserPassword {
    static async encryptPassword(password, publicKey) {
        const rsaEncryptor = new RSAEncryptor();

        await rsaEncryptor.importPublicKey(publicKey);

        return await rsaEncryptor.encrypt(password);
    }

    static async decryptPassword(encryptedPassword, privateKey) {
        const rsaEncryptor = new RSAEncryptor();

        await rsaEncryptor.importPrivateKey(privateKey);

        return await rsaEncryptor.decrypt(encryptedPassword);
    }

    static async saveToSession(password, publicKey) {
        const encryptedPassword = await this.encryptPassword(password, publicKey);

        sessionStorage.setItem('userPassword', encryptedPassword);
    }

    static async getFromSession(privateKey) {
        const encryptedPassword = sessionStorage.getItem('userPassword');

        if (!encryptedPassword) {
            throw new Error('User password not found!');
        }

        return await this.decryptPassword(encryptedPassword, privateKey);
    }
}
