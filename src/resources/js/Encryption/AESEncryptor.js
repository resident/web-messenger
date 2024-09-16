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

    async encrypt(text) {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(text);

        const iv = crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            this.key,
            encoded
        );

        return {
            encrypted: encrypted.toBase64(),
            iv: iv.toBase64()
        };
    }

    async decrypt(encrypted, iv) {
        const decrypted = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: Uint8Array.fromBase64(iv)
            },
            this.key,
            ArrayBuffer.fromBase64(encrypted)
        );

        const decoder = new TextDecoder();

        return decoder.decode(decrypted);
    }
}
