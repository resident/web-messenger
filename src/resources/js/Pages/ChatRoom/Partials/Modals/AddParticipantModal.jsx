import { useState, useRef, useEffect, useContext } from 'react';
import Modal from '@/Components/Modal.jsx';
import { ApplicationContext } from '@/Components/ApplicationContext.jsx';
import UserCard from '@/Components/UserCard.jsx';
import axios from 'axios';
import AESKeyGenerator from "@/Encryption/AESKeyGenerator.js";
import RSAEncryptor from "@/Encryption/RSAEncryptor.js";
import ChatRoom from '@/Common/ChatRoom.js';
import CustomScrollArea from '@/Components/CustomScrollArea';
import {
    UserPlusIcon,
    ExclamationCircleIcon,
} from "@heroicons/react/24/solid";

export default function AddParticipantModal({ chatRoom, onClose }) {
    const { user, userPrivateKey, chatRooms, setChatRooms } = useContext(ApplicationContext);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchCompleted, setSearchCompleted] = useState(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmationType, setConfirmationType] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);

    const currentRequestController = useRef(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (!searchQuery) {
            setSearchResults([]);
            setIsSearching(false);
            setSearchCompleted(false);
        }
    }, [searchQuery]);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (!value) {
            return;
        }
        timeoutRef.current = setTimeout(() => doSearch(value), 300);
    };

    const doSearch = async (query) => {
        if (currentRequestController.current) {
            currentRequestController.current.abort();
        }

        const controller = new AbortController();
        currentRequestController.current = controller;

        setIsSearching(true);
        setSearchCompleted(false);

        try {
            const resp = await axios.get(route('users.search', { name: query }), {
                signal: controller.signal,
            });
            let results = resp.data || [];

            const existingUserIds = chatRoom.users.map(u => u.id);
            results = results.filter(u => !existingUserIds.includes(u.id));

            setSearchResults(results);
        } catch (error) {
            if (axios.isCancel(error)) {
                //
            } else {
                console.error(error);
            }

        } finally {
            setIsSearching(false);
            setSearchCompleted(true);

            if (currentRequestController.current === controller) {
                currentRequestController.current = null;
            }
        }
    };

    const onSearchResultUserClick = (userToAdd) => {
        setSelectedUser(userToAdd);

        if (chatRoom.users.length === 2) {
            setConfirmationType('twoToThree');
        } else {
            setConfirmationType('add');
        }
        setShowConfirmModal(true);
    };

    const closeConfirm = () => {
        setShowConfirmModal(false);
        setSelectedUser(null);
        setConfirmationType('');
    };

    const confirmAddUser = async () => {
        if (!selectedUser) return;
        closeConfirm();

        try {
            const localUserPivot = chatRoom.users.find(u => u.id === user.id)?.pivot;
            if (!localUserPivot?.chat_room_key) {
                throw new Error("Cannot add user - missing chat_room_key for local user pivot");
            }

            const chatRoomKeyPlain = await ChatRoom.decryptChatRoomKey(userPrivateKey, localUserPivot.chat_room_key);
            const rsaEncryptor = new RSAEncryptor();
            await rsaEncryptor.importPublicKey(selectedUser.public_key);
            const newlyEncryptedKey = await rsaEncryptor.encrypt(chatRoomKeyPlain);

            const routeUrl = route('chat_rooms.add_user', {
                chatRoom: chatRoom.id,
                userToAdd: selectedUser.id,
            });
            const resp = await axios.post(routeUrl, {
                chat_room_key: newlyEncryptedKey,
            });

            const { id, added_user } = resp.data;
            setChatRooms(prev => prev.map(cr => {
                if (cr.id !== id) return cr;
                if (cr.users.some(u => u.id === added_user.id)) {
                    return cr;
                }
                return {
                    ...cr,
                    users: [...cr.users, added_user],
                };
            }));

            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    const confirmCreateNewChat = async () => {
        if (!selectedUser) return;
        closeConfirm();

        try {
            const other = chatRoom.users.find(u => u.id !== user.id);
            if (!other) throw new Error("No 'other' user found in 2-person chat.");

            const newAesKey = await AESKeyGenerator.generateKey();

            const participants = [user, other, selectedUser];
            const usersPayload = [];

            for (let p of participants) {
                const rsaEncryptor = new RSAEncryptor();
                await rsaEncryptor.importPublicKey(p.public_key);
                const encryptedKey = await rsaEncryptor.encrypt(newAesKey);
                usersPayload.push({
                    id: p.id,
                    name: p.name,
                    chat_room_key: encryptedKey,
                });
            }

            const newTitle = `Chat-${Math.floor(new Date().getTime() / 1000)}`;
            const response = await axios.post(route('chat_rooms.store'), {
                title: newTitle,
                users: usersPayload,
                shouldRedirect: false,
            });
            const newChatRoom = response.data;
            setChatRooms((prev) => [newChatRoom, ...prev]);
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Modal show={true} onClose={onClose} maxWidth="md" className="p-5 w-full sm:maw-w-md">
            <div className="flex justify-between items-center mb-2">
                <div className="text-lg flex items-center justify-center gap-1 font-semibold">
                    <UserPlusIcon className="size-6 pb-[2px]" />
                    Add Participant
                </div>
                <button onClick={onClose}>✕</button>
            </div>
            <hr />

            <div className="mt-4">
                <input
                    type="text"
                    className="w-full border p-2 rounded"
                    placeholder="Search users by name..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                />
            </div>

            <div className="mt-2">
                <h3 className="font-semibold mb-1">Search Results</h3>
                <div className={`border rounded p-2 ${!searchQuery ? "border-gray-200" : "border-blue-200"} transition-colors duration-200`}>
                    {!searchQuery && (
                        <div className="italic text-sm text-gray-500">
                            Type in to search for a user
                        </div>
                    )}

                    {searchQuery && (
                        <CustomScrollArea maxHeight="240px">
                            {(isSearching || (!isSearching && !searchCompleted)) && (
                                <div className="italic text-sm text-blue-500">
                                    Searching for "{searchQuery}"...
                                </div>
                            )}

                            {!isSearching && searchCompleted && searchResults.length === 0 && (
                                <div className="text-sm text-gray-500">
                                    No users found matching "{searchQuery}"
                                </div>
                            )}

                            {!isSearching && searchCompleted && searchResults.length > 0 && (
                                searchResults.map((u) => (
                                    <UserCard
                                        key={u.id}
                                        user={u}
                                        showLastSeen={false}
                                        onClick={() => onSearchResultUserClick(u)}
                                    />
                                ))
                            )}
                        </CustomScrollArea>
                    )}
                </div>
            </div>

            {showConfirmModal && selectedUser && (
                <Modal show={true} onClose={closeConfirm} maxWidth="sm" className="p-5 w-full sm:max-w-sm">
                    {confirmationType === 'twoToThree' ? (
                        <>
                            <div className="mb-3 text-red-500 text-lg flex items-center justify-center gap-1 font-semibold">
                                <ExclamationCircleIcon className="size-6 pb-[2px]" />
                                Private chat
                            </div>
                            <p>
                                You are currently in a 2-person chat. Do you want to:
                            </p>
                            <ul className="list-disc list-inside my-3 space-y-1">
                                <li>
                                    <strong>Add "{selectedUser.name}"</strong> directly to this existing chat?
                                </li>
                                <li>
                                    Create a new chat with <strong>{user.name}</strong>, <strong>{chatRoom?.users.find(u => u.id !== user.id)?.name}</strong>, and <strong>{selectedUser.name}</strong>?
                                </li>
                            </ul>
                            <div className="flex justify-between gap-2 mt-4">
                                <button
                                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                                    onClick={closeConfirm}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-500 rounded"
                                    onClick={confirmAddUser}
                                >
                                    Add to current chat
                                </button>
                                <button
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 rounded"
                                    onClick={confirmCreateNewChat}
                                >
                                    Create new chat
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-lg font-semibold mb-3">
                                Add "{selectedUser.name}" to this chat?
                            </div>
                            <div className="flex justify-between gap-2 mt-4">
                                <button
                                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                                    onClick={closeConfirm}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-500 rounded"
                                    onClick={confirmAddUser}
                                >
                                    Add
                                </button>
                            </div>
                        </>
                    )}
                </Modal>
            )}
        </Modal>
    );
}
