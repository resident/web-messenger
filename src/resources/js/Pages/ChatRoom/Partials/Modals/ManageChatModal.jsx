import Modal from "@/Components/Modal.jsx";
import { useState, useContext } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";
import axios from "axios";
import ManageRolesModal from "./ManageRolesModal.jsx";
import AutoDeleteSettings from "../AutoDeleteSettings.jsx";
import AddParticipantModal from "./AddParticipantModal.jsx";
import RemoveParticipantModal from "./RemoveParticipantModal.jsx";
import {
    AdjustmentsVerticalIcon,
    UserCircleIcon,
    UserMinusIcon,
    UserPlusIcon,
    ClockIcon,
} from '@heroicons/react/24/solid';

export default function ManageChatModal({ chatRoom, onClose }) {
    const { user, chatRooms, setChatRooms } = useContext(ApplicationContext);
    const [chatTitle, setChatTitle] = useState(chatRoom.title);
    const [showRolesModal, setShowRolesModal] = useState(false);
    const [showAutoDeleteModal, setShowAutoDeleteModal] = useState(false);
    const [showAddParticipants, setShowAddParticipants] = useState(false);
    const [showRemoveParticipants, setShowRemoveParticipants] = useState(false);

    const pivot = chatRoom?.users.find(u => u.id === user.id)?.pivot;
    const canChangeTitle = pivot?.permissions?.includes('change_chat_info') || pivot?.role_name === 'owner';
    const canManageRoles = pivot?.permissions?.includes('change_roles_of_others') || pivot?.role_name === 'owner';
    const canManageAutoDelete = pivot?.permissions?.includes('set_auto_delete') || pivot?.role_name === 'owner';
    const canAddRemoveParticipants = pivot?.permissions?.includes('add_remove_users') || pivot?.role_name === 'owner';

    const updateTitle = async () => {
        if (chatTitle === chatRoom.title) {
            onClose();
            return;
        }
        try {
            const res = await axios.put(route('chat_rooms.update', chatRoom.id), {
                title: chatTitle,
            });
            setChatRooms(prev => prev.map(cr =>
                cr.id === res.data.id ? { ...cr, title: res.data.title } : cr
            ));
            onClose();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Modal show={true} onClose={onClose} maxWidth="sm" className="p-5 !pb-3 w-full sm:max-w-sm">
            <div className="flex justify-between items-center mb-2">
                <div className="text-lg flex items-center justify-center gap-1 font-semibold">
                    <AdjustmentsVerticalIcon className="size-6 pb-[2px]" />
                    <span>Chat Manager <span className="text-blue-500 text-xl">[{pivot?.role_name.toUpperCase()}]</span></span>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <hr className="mb-3" />

            <div className="">
                {canChangeTitle && (
                    <div className="group">
                        <div className="font-medium text-md text-gray-500 group-focus-within:text-blue-500 transition-colors duration-200">
                            Chat title
                        </div>
                        <input
                            type="text"
                            className="w-full mb-1 pl-0 py-1 border-l-0 border-r-0 border-t-0 border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-0 transition-colors duration-200"
                            value={chatTitle}
                            onChange={(e) => setChatTitle(e.target.value)}
                        />
                    </div>
                )}

                <div className="flex flex-col mb-2">
                    {canManageRoles && (
                        <button
                            className="w-full text-blue-500 border-l-2 border-gray-300
                            hover:bg-blue-100 hover:border-blue-300
                            px-4 py-2 rounded-br flex items-center gap-2"
                            onClick={() => setShowRolesModal(true)}
                        >
                            <UserCircleIcon className="size-6" />
                            Manage roles
                        </button>
                    )}
                    {canManageAutoDelete && (
                        <button
                            className="w-full text-orange-500 border-l-2 border-gray-300
                            hover:bg-orange-100 hover:border-orange-300
                            px-4 py-2 rounded-r flex items-center gap-2"
                            onClick={() => setShowAutoDeleteModal(true)}
                        >
                            <ClockIcon className="size-6" />
                            Manage auto delete
                        </button>
                    )}
                    {canAddRemoveParticipants && (
                        <button
                            className="w-full text-green-500 border-l-2 border-gray-300
                            hover:bg-green-100 hover:border-green-300
                            px-4 py-2 rounded-r flex items-center gap-2"
                            onClick={() => setShowAddParticipants(true)}
                        >
                            <UserPlusIcon className="size-6" />
                            Add participants
                        </button>
                    )}
                    {canAddRemoveParticipants && (
                        <button
                            className="w-full text-red-500 border-l-2 border-gray-300
                            hover:bg-red-100 hover:border-red-300
                            px-4 py-2 rounded-tr flex items-center gap-2"
                            onClick={() => setShowRemoveParticipants(true)}
                        >
                            <UserMinusIcon className="size-6" />
                            Remove participants
                        </button>
                    )}
                    {!canManageRoles && !canManageAutoDelete && !canAddRemoveParticipants && (
                        <span className="w-full border-l-2 border-gray-300 mt-1 text-gray-500 italic
                            hover:bg-gray-100 hover:border-gray-500
                            px-4 py-2 rounded-tr"
                        >
                            No other permissions...
                        </span>
                    )}
                </div>

                <hr />
                <div className="flex justify-between gap-1 mt-2">
                    <button
                        className="flex-1 text-black hover:bg-gray-100 px-4 py-2 rounded"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="flex-1 text-blue-500 hover:bg-blue-100 px-4 py-2 rounded"
                        onClick={updateTitle}
                    >
                        Save
                    </button>
                </div>
            </div>

            {showRolesModal && (
                <ManageRolesModal
                    chatRoom={chatRoom}
                    onClose={() => setShowRolesModal(false)}
                />
            )}

            {showAutoDeleteModal && (
                <Modal show={true} onClose={() => setShowAutoDeleteModal(false)} maxWidth="sm" className="p-5 w-full sm:max-w-sm">
                    <AutoDeleteSettings
                        chatRoom={chatRoom}
                        mode="manage_chat"
                        canManageAutoDelete={canManageAutoDelete}
                        onClose={() => setShowAutoDeleteModal(false)}
                    />
                </Modal>
            )}

            {showAddParticipants && (
                <AddParticipantModal
                    chatRoom={chatRoom}
                    onClose={() => setShowAddParticipants(false)}
                />
            )}

            {showRemoveParticipants && (
                <RemoveParticipantModal
                    chatRoom={chatRoom}
                    onClose={() => setShowRemoveParticipants(false)}
                />
            )}
        </Modal>
    );
}
