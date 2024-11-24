import RSAEncryptor from "@/Encryption/RSAEncryptor.js";

export default class ChatRoom {
    static async decryptChatRoomKey(privateKey, chatRoomKey) {
        const rsaEncryptor = new RSAEncryptor();

        await rsaEncryptor.importPrivateKey(privateKey);

        return await rsaEncryptor.decrypt(chatRoomKey);
    }

    static findChatRoomByUsers(chatRooms, users) {
        return chatRooms.find(
            chatRoom => chatRoom.users.length === users.length && chatRoom.users.every(
                user => users.some(
                    user2 => user.id === user2.id
                )
            )
        );
    }
}
