import UserRsaKeysStorage from "@/Common/UserRsaKeysStorage.js";
import {useContext, useEffect} from "react";
import RSAKeysGenerator from "@/Encryption/RSAKeysGenerator.js";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";
import RSAEncryptor from "@/Encryption/RSAEncryptor.js";
import UserPassword from "@/Common/UserPassword.js";

export default function RotateUserRsaKeys({}) {
    const {
        userPrivateKey,
        chatRooms, setChatRooms,
    } = useContext(ApplicationContext);

    const userRsaKeysStorage = new UserRsaKeysStorage();

    const rotationTimeout = (import.meta.env.VITE_USER_KEYS_ROTATION_TIMEOUT ?? 604800) * 1000;

    const isNeedRotation = () => {
        if (!localStorage.getItem('userKeysRotatedAt')) {
            return true;
        }

        const userKeysRotatedAt = new Date(localStorage.getItem('userKeysRotatedAt'));
        const dateDiff = new Date() - userKeysRotatedAt;

        return dateDiff >= rotationTimeout;
    };

    const rotateKeys = async () => {
        const rsaKeysGenerator = new RSAKeysGenerator();
        const rsaEncryptor = new RSAEncryptor();

        const userPassword = await UserPassword.getFromSession(userPrivateKey);

        await rsaKeysGenerator.generateKeys();
        const newPublicKey = await rsaKeysGenerator.exportPublicKey();
        const newPrivateKey = await rsaKeysGenerator.exportPrivateKey();

        await rsaEncryptor.importPublicKey(newPublicKey);
        await rsaEncryptor.importPrivateKey(userPrivateKey);


        const newChatRoomKeys = [];

        for (const chatRoom of chatRooms) {
            const chatRoomKey = await rsaEncryptor.decrypt(chatRoom.pivot.chat_room_key);
            const encryptedChatRoomKey = await rsaEncryptor.encrypt(chatRoomKey);

            newChatRoomKeys.push({
                chat_room_id: chatRoom.id,
                chat_room_key: encryptedChatRoomKey,
            });
        }

        axios.put(route('rotate-keys.update'), {
            public_key: newPublicKey,
            keys: newChatRoomKeys
        }).then((response) => {
            if (response.status === 200) {
                userRsaKeysStorage.saveKeysToLocalStorage(userPassword, newPublicKey, newPrivateKey);
                userRsaKeysStorage.saveKeysToSessionStorage(newPublicKey, newPrivateKey);

                UserPassword.saveToSession(userPassword, newPublicKey);

                setChatRooms(response.data.chatRooms);

                localStorage.setItem('userKeysRotatedAt', (new Date()).toISOString());
            }
        });
    };

    useEffect(() => {
        const intervalId = setInterval(async () => {
            if (chatRooms.length && isNeedRotation()) {
                try {
                    await rotateKeys();
                } catch (e) {
                }
            }
        }, 1000);

        return () => {
            clearInterval(intervalId);
        };
    }, [chatRooms]);
}