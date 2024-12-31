import Modal from "@/Components/Modal.jsx";
import { useState, useContext, useEffect } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";
import ChatStatus from "../ChatStatus.jsx";
import ChatAvatar from "../ChatAvatar.jsx";
import ManageChatModal from "./ManageChatModal.jsx"
import axios from "axios";
import { router } from "@inertiajs/react";
import {
    TrashIcon,
    AdjustmentsVerticalIcon
} from '@heroicons/react/24/solid';
import {
    UsersIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline'
import CustomScrollArea from "@/Components/CustomScrollArea.jsx";
import UserCard from "@/Components/UserCard.jsx";

export default function ChatRoomInfoModal({ initialChatRoom, onClose }) {
    const {
        user,
        userPrivateKey,
        chatRooms, setChatRooms,
    } = useContext(ApplicationContext);

    const [chatRoom, setChatRoom] = useState(initialChatRoom);
    const [showManageChat, setShowManageChat] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        const updatedChatRoom = chatRooms.find(cr => cr.id === initialChatRoom.id);
        if (updatedChatRoom) {
            setChatRoom(updatedChatRoom);
            if (!userPrivateKey) {
                onClose();
            }
        } else {
            onClose();
        }
    }, [chatRooms, initialChatRoom, userPrivateKey]);

    const pivot = chatRoom?.users.find(u => u.id === user.id)?.pivot;
    const isOwner = pivot?.role_name === 'owner';
    const canManageChat = isOwner || (
        Array.isArray(pivot?.permissions) &&
        pivot.permissions.length > 0 &&
        !(
            pivot.permissions.length === 1 &&
            pivot.permissions.includes('delete_messages_of_others')
        )
    );

    const onDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDeleteOrLeave = async () => {
        setShowDeleteConfirm(false);

        try {
            const response = await axios.delete(route('chat_rooms.destroy', chatRoom.id));
            if (response.data.status === 'success') {
                setChatRooms(prev => prev.filter(cr => cr.id !== chatRoom.id));
                router.get(route('main'), {}, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: []
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const chatTitle = (() => {
        if (chatRoom?.users.length === 2) {
            const other = chatRoom?.users.find(u => u.id !== user.id);
            return other?.name ?? chatRoom?.title;
        }
        return chatRoom?.title;
    })();

    return (
        <Modal show={true} onClose={onClose} maxWidth="md" className="p-5 w-full sm:max-w-md">
            <div className="flex justify-between items-center mb-2">
                <div className="text-xl flex items-center justify-center gap-1 font-semibold">
                    <InformationCircleIcon className="size-6 pb-[2px]" />
                    Info
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <hr />

            <div className="">
                <div className="flex flex-col items-center">
                    <div className="flex justify-center my-4 size-20">
                        {chatRoom && (
                            <ChatAvatar
                                users={chatRoom.users}
                                localUser={user}
                                lastMessage={chatRoom.last_message}
                                size="full"
                                showOnlineBadgeForSecondUser={false}
                            />
                        )}
                    </div>
                    <div className="mt-2 text-lg">{chatTitle}</div>
                    <div className="mt-1">
                        {chatRoom && (
                            <ChatStatus chatRoom={chatRoom} />
                        )}
                    </div>
                </div>

                <div className="mt-4 mb-1 flex flex-col items-center">
                    {canManageChat && (
                        <button
                            className="w-full hover:bg-blue-100 text-blue-500 py-2 rounded flex items-center justify-center gap-2"
                            onClick={() => setShowManageChat(true)}
                        >
                            <AdjustmentsVerticalIcon className="size-4 pb-[1px]" />
                            Manage chat
                        </button>
                    )}
                    <button
                        className="w-full hover:bg-red-100 text-red-500 py-2 rounded flex items-center justify-center gap-2"
                        onClick={onDeleteClick}
                    >
                        <TrashIcon className="size-4 pb-[3px]" />
                        {isOwner ? "Delete chat" : "Leave chat"}
                    </button>
                </div>
                <hr />

                <div className="pt-4">
                    <div className="flex items-center mb-2">
                        <UsersIcon className="size-5 mr-2" />
                        <div className="font-semibold">
                            Participants ({chatRoom?.users.length})
                        </div>
                    </div>
                    <CustomScrollArea maxHeight="170px">
                        {chatRoom?.users.map(u => {
                            const roleName = u.pivot.role_name;
                            const roleBadge = !roleName || roleName === 'member' ? '' : roleName;
                            return (
                                <UserCard
                                    key={u.id}
                                    user={u}
                                    showLastSeen={true}
                                    showRoleBadge={!!roleBadge}
                                    roleBadge={roleBadge}
                                />
                            );
                        })}
                    </CustomScrollArea>
                </div>
            </div>

            {showDeleteConfirm && (
                <Modal show={true} onClose={() => setShowDeleteConfirm(false)} maxWidth="sm" className="p-4 !pb-2 w-full sm:max-w-md">
                    <div className="text-lg mb-4">
                        {isOwner
                            ? "Are you sure you want to delete chat for everyone?"
                            : "Are you sure you want to leave chat?"
                        }
                    </div>
                    <hr />
                    <div className="flex justify-between gap-1 mt-2">
                        <button
                            className="flex-1 px-4 py-2 text-blue-500 hover:bg-blue-100 rounded"
                            onClick={() => setShowDeleteConfirm(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="flex-1 px-4 py-2 text-red-500 hover:bg-red-100 rounded"
                            onClick={confirmDeleteOrLeave}
                        >
                            {isOwner ? "Delete" : "Leave"}
                        </button>
                    </div>
                </Modal>
            )}

            {showManageChat && (
                <ManageChatModal
                    chatRoom={chatRoom}
                    onClose={() => setShowManageChat(false)}
                />
            )}
        </Modal>
    )
}