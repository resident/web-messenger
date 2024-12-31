import { useContext, useMemo, useState } from 'react';
import Modal from '@/Components/Modal.jsx';
import { ApplicationContext } from '@/Components/ApplicationContext.jsx';
import UserCard from '@/Components/UserCard.jsx';
import axios from 'axios';
import { router } from "@inertiajs/react";
import CustomScrollArea from '@/Components/CustomScrollArea';
import {
    UserMinusIcon,
} from "@heroicons/react/24/solid";

export default function RemoveParticipantModal({ chatRoom, onClose }) {
    const { user, setChatRooms } = useContext(ApplicationContext);

    const [selectedUser, setSelectedUser] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const allParticipants = chatRoom.users.filter(u => u.pivot.role_name !== 'owner');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredParticipants = useMemo(() => {
        if (!searchQuery) {
            return allParticipants;
        }

        const lowerQuery = searchQuery.toLowerCase();
        return allParticipants.filter(p => p.name.toLowerCase().includes(lowerQuery));
    }, [allParticipants, searchQuery]);

    const onParticipantClick = (u) => {
        setSelectedUser(u);
        setShowConfirmModal(true);
    };

    const closeConfirm = () => {
        setSelectedUser(null);
        setShowConfirmModal(false);
    };

    const confirmRemoveUser = async () => {
        if (!selectedUser) return;
        closeConfirm();

        try {
            const resp = await axios.delete(
                route('chat_rooms.remove_user', {
                    chatRoom: chatRoom.id,
                    userToRemove: selectedUser.id,
                })
            );

            const { id, deleted_user } = resp.data;

            if (deleted_user.id === user.id) {
                setChatRooms((prev) => prev.filter((cr) => cr.id !== id));
                router.get(route('main'), {}, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: []
                });
                onClose();
                return;
            }

            setChatRooms((prev) =>
                prev.map((cr) => {
                    if (cr.id !== id) return cr;
                    return {
                        ...cr,
                        users: cr.users.filter((u) => u.id !== deleted_user.id),
                    };
                })
            );

            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Modal show={true} onClose={onClose} maxWidth="md" className="p-5 w-full sm:max-w-md">
            <div className="flex justify-between items-center mb-2">
                <div className="text-lg flex items-center justify-center gap-1 font-semibold">
                    <UserMinusIcon className="size-6 pb-[2px]" />
                    Remove Participant
                </div>
                <button onClick={onClose}>✕</button>
            </div>
            <hr />

            <div className="mt-4">
                <input
                    type="text"
                    className="w-full border p-2 rounded mb-2 border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-0 transition-colors duration-200"
                    placeholder="Search participant by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <CustomScrollArea maxHeight="256px">
                    {filteredParticipants.map((p) => {
                        const roleName = p.pivot.role_name;
                        const roleBadge = !roleName || roleName === 'member' ? '' : roleName;
                        return (
                            <UserCard
                                key={p.id}
                                user={p}
                                showLastSeen={false}
                                showRoleBadge={!!roleBadge}
                                roleBadge={roleBadge}
                                onClick={() => onParticipantClick(p)}
                            />
                        );
                    })}
                    {filteredParticipants.length === 0 && (
                        <div className="italic text-sm text-gray-500">
                            There are no removable participants.
                        </div>
                    )}
                </CustomScrollArea>
            </div>

            {showConfirmModal && selectedUser && (
                <Modal show={true} onClose={closeConfirm} maxWidth="sm">
                    <div className="p-4">
                        <div className="text-lg font-semibold mb-3">
                            Remove "{selectedUser.name}" from this chat?
                        </div>
                        <div className="flex justify-between gap-2 mt-4">
                            <button
                                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                                onClick={closeConfirm}
                            >
                                Cancel
                            </button>
                            <button
                                className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-500 rounded"
                                onClick={confirmRemoveUser}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </Modal>
    );
}
