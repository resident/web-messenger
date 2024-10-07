import RSAEncryptor from "@/Encryption/RSAEncryptor.js";

export default class ChatRoom {
    static async decryptChatRoomKey(privateKey, chatRoomKey) {
        const rsaEncryptor = new RSAEncryptor();

        await rsaEncryptor.importPrivateKey(privateKey);

        return await rsaEncryptor.decrypt(chatRoomKey);
    }
}
