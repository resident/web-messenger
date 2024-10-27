import {ChatBubbleOvalLeftIcon} from "@heroicons/react/24/outline/index.js";
import {router, useForm} from "@inertiajs/react";
import AESKeyGenerator from "@/Encryption/AESKeyGenerator.js";
import RSAEncryptor from "@/Encryption/RSAEncryptor.js";
import {useContext, useState} from "react";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";

export default function ProfileActions({auth, user}) {
    const {chatRooms} = useContext(ApplicationContext);

    const [isSelfProfile] = useState(auth.user.id === user.id);

    const {data, post, reset} = useForm({
        title: 'pm',
        users: [],
    });

    const findChatRoomByUsers = () => {
        return chatRooms.find(function (chatRoom) {
            return chatRoom.users.length === 2
                && chatRoom.users.find(u => u.id === auth.user.id)
                && chatRoom.users.find(u => u.id === user.id);
        });
    };

    const onChatClick = async () => {
        const chatRoom = findChatRoomByUsers();

        if (chatRoom) {
            return router.visit(route('main', chatRoom.id));
        }

        const chatRoomKey = await AESKeyGenerator.generateKey();
        const rsaEncryptor = new RSAEncryptor();

        for (let curUser of [auth.user, user]) {
            await rsaEncryptor.importPublicKey(curUser.public_key);
            const encryptedChatRoomKey = await rsaEncryptor.encrypt(chatRoomKey);

            data.users.push({
                id: curUser.id,
                name: curUser.name,
                chat_room_key: encryptedChatRoomKey,
            });
        }

        post(route('chat_rooms.store'), {
            onSuccess: () => reset(),
        });
    };

    return (
        <div className={`my-3 flex gap-2 ${isSelfProfile && 'hidden'}`}>
            <div className={`rounded-full p-2 hover:bg-gray-200 hover:cursor-pointer`}
                 onClick={onChatClick}
            >
                <ChatBubbleOvalLeftIcon className={`size-8`}/>
            </div>
        </div>
    );
}
