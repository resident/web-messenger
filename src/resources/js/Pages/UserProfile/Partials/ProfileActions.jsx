import {ChatBubbleOvalLeftIcon, PhoneIcon, VideoCameraIcon} from "@heroicons/react/24/outline/index.js";
import {router, useForm} from "@inertiajs/react";
import AESKeyGenerator from "@/Encryption/AESKeyGenerator.js";
import RSAEncryptor from "@/Encryption/RSAEncryptor.js";
import {useContext, useState} from "react";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";
import ChatRoom from "@/Common/ChatRoom.js";

export default function ProfileActions({auth, user}) {
    const {chatRooms, setOutputCall} = useContext(ApplicationContext);

    const [isSelfProfile] = useState(auth.user.id === user.id);

    const {data, post, reset} = useForm({
        title: 'pm',
        users: [],
    });

    const onChatClick = async () => {
        const chatRoom = ChatRoom.findChatRoomByUsers(chatRooms, [auth.user, user]);

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

    const makeCall = (type) => {
        setOutputCall({
            fromUser: auth.user,
            toUser: user,
            type: type,
        });
    };

    const onAudioCallClick = async () => {
        makeCall('audio');
    };

    const onVideoCallClick = async () => {
        makeCall('video');
    };

    return (
        <div className={`my-3 flex gap-2 ${isSelfProfile && 'hidden'}`}>
            <div className={`rounded-full p-2 hover:bg-gray-200 hover:cursor-pointer`}
                 onClick={onChatClick}
            >
                <ChatBubbleOvalLeftIcon className={`size-8`}/>
            </div>

            <div className={`rounded-full p-2 hover:bg-gray-200 hover:cursor-pointer`}
                 onClick={onAudioCallClick}
            >
                <PhoneIcon className={`size-8`}/>
            </div>

            <div className={`rounded-full p-2 hover:bg-gray-200 hover:cursor-pointer`}
                 onClick={onVideoCallClick}
            >
                <VideoCameraIcon className={`size-8`}/>
            </div>
        </div>
    );
}
