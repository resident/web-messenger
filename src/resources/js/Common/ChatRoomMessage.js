import AESEncryptor from "@/Encryption/AESEncryptor.js";
import AESKeyGenerator from "@/Encryption/AESKeyGenerator.js";
import Utils from "@/Common/Utils.js";

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

    static async encryptAttachment(attachment, chatRoomKey) {
        const attachmentKey = await AESKeyGenerator.generateKey();
        const aesEncryptor = new AESEncryptor();
        await aesEncryptor.importKey(attachmentKey);

        const attachmentArrayBuffer = await Utils.fileToArrayBuffer(attachment);

        const {encrypted: attachmentEncrypted, iv: attachmentIv} = await aesEncryptor.encryptRaw(attachmentArrayBuffer);

        await aesEncryptor.importKey(chatRoomKey);

        const {
            encrypted: attachmentKeyEncrypted,
            iv: attachmentKeyIv
        } = await aesEncryptor.encryptString(attachmentKey);

        return {
            name: attachment.name,
            size: attachment.size,
            mimeType: attachment.type ?? 'application/octet-stream',
            attachment: attachmentEncrypted,
            attachmentIv,
            attachmentKey: attachmentKeyEncrypted,
            attachmentKeyIv,
        };
    }

    static async encryptAttachments(attachments, chatRoomKey) {
        const promises = [];

        attachments.forEach((attachment) => {
            const promise = ChatRoomMessage.encryptAttachment(attachment, chatRoomKey);

            promises.push(promise);
        });

        return Promise.all(promises);
    }

    static async sendMessage(message, chatRoom, chatRoomKey, attachments, onUploadProgress = progress => null) {
        const {
            messageEncrypted,
            messageIv,
            messageKeyEncrypted,
            messageKeyIv
        } = await ChatRoomMessage.encryptMessage(chatRoomKey, message);

        const attachmentsEncrypted = await ChatRoomMessage.encryptAttachments(attachments, chatRoomKey);

        return axios.post(route('chat_rooms.messages.store', chatRoom.id), {
            message: messageEncrypted,
            messageIv,
            messageKey: messageKeyEncrypted,
            messageKeyIv,
            attachments: attachmentsEncrypted,
        }, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'X-Socket-ID': Echo.socketId(),
            },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onUploadProgress(percentCompleted);
            }
        });
    }

    static async forwardMessage(message, chatRoom, fromChatRoomKey, toChatRoomKey, onUploadProgress = progress => null) {
        const {
            messageEncrypted,
            messageIv,
            messageKeyEncrypted,
            messageKeyIv
        } = await ChatRoomMessage.encryptMessage(toChatRoomKey, message.message);

        const fromAesEncryptor = new AESEncryptor();
        const toAesEncryptor = new AESEncryptor();

        await fromAesEncryptor.importKey(fromChatRoomKey);
        await toAesEncryptor.importKey(toChatRoomKey);

        const attachments = [];

        for (const attachment of message.attachments) {
            const decryptedAttachmentKey = await fromAesEncryptor.decryptString(
                attachment.attachment_key,
                attachment.attachment_key_iv
            );

            const {
                encrypted: encryptedAttachmentKey,
                iv: encryptedAttachmentKeyIv
            } = await toAesEncryptor.encryptString(decryptedAttachmentKey);

            attachments.push({
                id: attachment.id,
                attachmentKey: encryptedAttachmentKey,
                attachmentKeyIv: encryptedAttachmentKeyIv,
            });
        }

        return axios.post(route('chat_rooms.messages.forward', [chatRoom.id, message.id]), {
            message: messageEncrypted,
            messageIv,
            messageKey: messageKeyEncrypted,
            messageKeyIv,
            attachments,
        }, {
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onUploadProgress(percentCompleted);
            }
        });
    }
}
