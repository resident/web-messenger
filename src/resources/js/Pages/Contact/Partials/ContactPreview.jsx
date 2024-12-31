import Dropdown from '@/Components/Dropdown';
import {EllipsisVerticalIcon} from '@heroicons/react/24/solid';
import ChatRoom from '@/Common/ChatRoom.js'
import {useContext} from "react";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";
import {Link, router, useForm} from "@inertiajs/react";
import AESKeyGenerator from "@/Encryption/AESKeyGenerator.js";
import RSAEncryptor from "@/Encryption/RSAEncryptor.js";

const ContactPreview = ({contact, onDelete}) => {
    const {user, chatRooms} = useContext(ApplicationContext);

    const {data, post, reset} = useForm({
        title: 'pm',
        users: [],
    });

    const openChatRoom = async () => {
        const users = [user, contact];
        const chatRoom = ChatRoom.findChatRoomByUsers(chatRooms, users);

        if (chatRoom) {
            return router.visit(route('main', chatRoom.id));
        }

        const chatRoomKey = await AESKeyGenerator.generateKey();
        const rsaEncryptor = new RSAEncryptor();

        for (let curUser of users) {
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

    const handleDelete = async () => {
        try {
            await axios.delete(route('contact.delete'), {
                data: {contact_id: contact.id}
            });
            onDelete(contact.id);
        } catch (error) {
            console.error('Error deleting contact:', error);
        }
    };

    return (
        <div
            className="p-2 flex justify-between items-center cursor-pointer relative hover:bg-gray-100">
            <div className="flex items-center gap-2 w-full"
                 onClick={openChatRoom}>
                {contact.avatar && <img
                    src={`${import.meta.env.VITE_AVATARS_STORAGE}/${contact.avatar.path}`}
                    alt={contact.name}
                    className="size-10 rounded-full object-cover"
                /> || <div className={`size-10 rounded-full bg-blue-300`}></div>}

                <p className="text-lg font-medium">{contact.name}</p>
            </div>

            <Dropdown>
                <Dropdown.Trigger className="text-gray-500 hover:text-gray-700 focus:outline-none">
                    <EllipsisVerticalIcon className='w-7'/>
                </Dropdown.Trigger>
                <Dropdown.Content contentClasses="py-0 bg-white">
                    <Link
                        href={route('user-profile.show', contact.id)}
                        className="w-full block text-center text-md text-gray-700 hover:bg-gray-100"
                    >
                        Show Profile
                    </Link>

                    <button
                        onClick={handleDelete}
                        className="w-full text-md text-gray-700 hover:bg-gray-100"
                    >
                        Delete
                    </button>
                </Dropdown.Content>
            </Dropdown>
        </div>
    );
};

export default ContactPreview;
