export default class RSAKeysGenerator {
    constructor() {
        this.publicKey = null;
        this.privateKey = null;
    }

    async generateKeys() {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true,
            ["encrypt", "decrypt"]
        );

        this.publicKey = keyPair.publicKey;
        this.privateKey = keyPair.privateKey;
    }

    async exportPublicKey() {
        const exported = await window.crypto.subtle.exportKey("spki", this.publicKey);

        return exported.toBase64();
    }

    async exportPrivateKey() {
        const exported = await window.crypto.subtle.exportKey("pkcs8", this.privateKey);

        return exported.toBase64();
    }
}

