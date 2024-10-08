export default class PBKDF2 {
    generateSalt() {
        return crypto.getRandomValues(new Uint8Array(16));
    }

    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            encoder.encode(password),
            {name: "PBKDF2"},
            false,
            ["deriveKey"]
        );

        return crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            {name: "AES-GCM", length: 256},
            true,
            ["encrypt", "decrypt"]
        );
    }

    async encrypt(password, data) {
        const salt = this.generateSalt();
        const key = await this.deriveKey(password, salt);

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(data);

        const encrypted = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            encoded
        );

        return {
            encrypted: encrypted.toBase64(),
            salt: salt.toBase64(),
            iv: iv.toBase64(),
        };
    }

    async decrypt(password, {encrypted, salt, iv}) {
        const key = await this.deriveKey(password, Uint8Array.fromBase64(salt));

        const decrypted = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: Uint8Array.fromBase64(iv),
            },
            key,
            ArrayBuffer.fromBase64(encrypted)
        );

        return new TextDecoder().decode(decrypted);
    }
}
