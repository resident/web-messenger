export default class AESKeyGenerator {
    static async generateKey() {
        const key = await crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: 256
            },
            true,
            ["encrypt", "decrypt"]
        );

        const exported = await crypto.subtle.exportKey("raw", key);

        return exported.toBase64();
    }
}

