import AESEncryptor from "@/Encryption/AESEncryptor.js";
import AESKeyGenerator from "@/Encryption/AESKeyGenerator.js";

export default class ChatRoomMessage {
    static async encryptMessage(chatRoomKey, message) {
        const messageKey = await AESKeyGenerator.generateKey();

        const aesEncryptor = new AESEncryptor();
        await aesEncryptor.importKey(messageKey);
        const {iv: messageIv, encrypted: messageEncrypted} = await aesEncryptor.encryptString(message);

        await aesEncryptor.importKey(chatRoomKey);
        const {iv: messageKeyIv, encrypted: messageKeyEncrypted} = await aesEncryptor.encryptString(messageKey);

        return {messageEncrypted, messageIv, messageKeyEncrypted, messageKeyIv};
    }

    static async decryptMessage(chatRoomKey, message) {
        const aesEncryptor = new AESEncryptor();
        await aesEncryptor.importKey(chatRoomKey);
        const messageKey = await aesEncryptor.decryptString(message.message_key, message.message_key_iv);

        await aesEncryptor.importKey(messageKey);
        message.message = await aesEncryptor.decryptString(message.message, message.message_iv);

        delete message.message_iv;
        delete message.message_key;
        delete message.message_key_iv;

        return message;
    }
}
