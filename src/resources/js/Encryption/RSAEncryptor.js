export default class RSAEncryptor {
    constructor() {
        this.publicKey = null;
        this.privateKey = null;
    }

    async importPublicKey(publicKey) {
        this.publicKey = await window.crypto.subtle.importKey(
            'spki',
            ArrayBuffer.fromBase64(publicKey),
            {
                name: 'RSA-OAEP',
                hash: {name: 'SHA-256'}
            },
            true,
            ['encrypt']
        );
    }

    async importPrivateKey(privateKey) {
        this.privateKey = await window.crypto.subtle.importKey(
            'pkcs8',
            ArrayBuffer.fromBase64(privateKey),
            {
                name: 'RSA-OAEP',
                hash: {name: 'SHA-256'}
            },
            true,
            ['decrypt']
        );
    }

    async encrypt(text) {
        const encoded = new TextEncoder().encode(text);
        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: "RSA-OAEP"
            },
            this.publicKey,
            encoded
        );
        return encrypted.toBase64();
    }

    async decrypt(encrypted) {
        const encryptedArrayBuffer = ArrayBuffer.fromBase64(encrypted);
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "RSA-OAEP"
            },
            this.privateKey,
            encryptedArrayBuffer
        );

        return new TextDecoder().decode(decrypted);
    }
}
