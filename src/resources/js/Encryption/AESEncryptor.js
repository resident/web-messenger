export default class AESEncryptor {
    constructor() {
        this.key = null;
    }

    async importKey(key) {
        this.key = await crypto.subtle.importKey(
            "raw",
            ArrayBuffer.fromBase64(key),
            {
                name: "AES-GCM",
            },
            true,
            ["encrypt", "decrypt"]
        );
    }

    async encryptRaw(data) {
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv
            },
            this.key,
            data
        );

        return {encrypted, iv: iv.toBase64()};
    }

    async decryptRaw(encrypted, iv) {
        return await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: Uint8Array.fromBase64(iv),
            },
            this.key,
            encrypted
        );
    }

    async encryptString(text) {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(text);

        const {encrypted, iv} = await this.encryptRaw(encoded);

        return {
            encrypted: encrypted.toBase64(),
            iv
        };
    }

    async decryptString(encrypted, iv) {
        const decrypted = await this.decryptRaw(ArrayBuffer.fromBase64(encrypted), iv);

        const decoder = new TextDecoder();

        return decoder.decode(decrypted);
    }
}
