import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useEffect, useRef, useState } from 'react';
import InputError from '@/Components/InputError.jsx';
import InputLabel from '@/Components/InputLabel.jsx';
import PrimaryButton from '@/Components/PrimaryButton.jsx';
import TextInput from '@/Components/TextInput.jsx';
import Select from '@/Components/Select.jsx';
import { Head, useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import SelectUser from "@/Components/SelectUser.jsx";
import AESKeyGenerator from "@/Encryption/AESKeyGenerator.js";
import RSAEncryptor from "@/Encryption/RSAEncryptor.js";

export default function Create({ auth }) {
    const usersSelect = useRef();

    const [chatRoomKey, setChatRoomKey] = useState("");

    const { data, setData, errors, post, reset, processing, recentlySuccessful } = useForm({
        title: '',
        users: [],
        shouldRedirect: true,
    });

    useEffect(() => {
        (async () => {
            const key = await AESKeyGenerator.generateKey();

            setChatRoomKey(key);
        })()
    }, []);

    useEffect(() => {
        if (!chatRoomKey) return;

        (async () => {
            await addUser(auth.user);
        })();
    }, [chatRoomKey]);

    const addUser = async (user) => {
        if (data.users.find(u => u.id === user.id)) return;

        const rsaEncryptor = new RSAEncryptor();

        await rsaEncryptor.importPublicKey(user.public_key);

        const encryptedChatRoomKey = await rsaEncryptor.encrypt(chatRoomKey);

        setData('users', [...data.users, {
            id: user.id,
            name: user.name,
            chat_room_key: encryptedChatRoomKey,
        }]);
    };

    const removeUser = (e) => {
        e.preventDefault();

        const selectedUsers = Array.from(usersSelect.current.selectedOptions).map(option => option.value);

        setData('users', data.users.filter(user => !selectedUsers.some(userId => {
            return userId === `${user.id}` && userId !== `${auth.user.id}`;
        })));
    };

    const createChatRoom = (e) => {
        e.preventDefault();

        post(route('chat_rooms.store'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };


    return (
        <AuthenticatedLayout
            user={auth.user}
            header="Chat Rooms"
        >
            <Head title="Create Chat Room" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">

                            <form onSubmit={createChatRoom} className="mt-6 space-y-6">
                                <div>
                                    <InputLabel htmlFor="title" value="Title" />

                                    <TextInput
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        type="text"
                                        className="mt-1 block w-full"
                                    />

                                    <InputError message={errors.title} className="mt-2" />
                                </div>

                                <SelectUser onUserSelected={addUser} buttonText="Add" />

                                <div>
                                    <InputLabel htmlFor="users" value="Users" />

                                    <Select
                                        ref={usersSelect}
                                        multiple
                                        className="mt-1 block w-full mb-2"
                                    >
                                        {data.users.map((user, key) => (
                                            <option key={key} value={user.id}>{user.name}</option>
                                        ))}
                                    </Select>

                                    <InputError message={errors.users} className="mt-2" />

                                    <PrimaryButton disabled={data.users.length === 0}
                                        onClick={removeUser}
                                    >-</PrimaryButton>
                                </div>

                                <div className="flex items-center gap-4">
                                    <PrimaryButton disabled={processing}>Create</PrimaryButton>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-gray-600">Created.</p>
                                    </Transition>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
