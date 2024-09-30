import {Dropbox as DropboxClient} from "dropbox";
import Utils from "@/Common/Utils.js";
import PBKDF2 from "@/Encryption/PBKDF2.js";

export default class Dropbox {
    #settingNamePrefix = 'dropbox';
    #client;

    constructor(options) {
        this.#client = new DropboxClient(options);
    }

    get client() {
        return this.#client;
    }

    #getSettingName(name) {
        return `${this.#settingNamePrefix}_${name}`;
    }

    getSetting(name, defaultValue = null) {
        return localStorage.getItem(this.#getSettingName(name)) ?? defaultValue;
    }

    setSetting(name, value) {
        localStorage.setItem(this.#getSettingName(name), value);
    }

    removeSetting(name) {
        localStorage.removeItem(this.#getSettingName(name));
    }

    getAccessTokenFromUrl(url = null) {
        return Utils.parseQueryString(url ?? window.location.hash).access_token;
    }

    async getAccessToken() {
        const accessTokenEncrypted = JSON.parse(this.getSetting("accessToken"));

        if (!accessTokenEncrypted) {
            return null;
        }

        const pbkdf2 = new PBKDF2();
        const userPassword = await Utils.getUserPassword();
        const {encrypted, salt, iv} = accessTokenEncrypted;

        return await pbkdf2.decrypt(userPassword,
            ArrayBuffer.fromBase64(encrypted),
            Uint8Array.fromBase64(salt),
            Uint8Array.fromBase64(iv),
        );
    }

    async setAccessToken(accessToken) {
        const pbkdf2 = new PBKDF2();
        const userPassword = await Utils.getUserPassword();

        const {encrypted, salt, iv} = await pbkdf2.encrypt(userPassword, accessToken);

        this.setSetting("accessToken", JSON.stringify({
            encrypted: encrypted.toBase64(),
            salt: salt.toBase64(),
            iv: iv.toBase64(),
        }));
    }
}
