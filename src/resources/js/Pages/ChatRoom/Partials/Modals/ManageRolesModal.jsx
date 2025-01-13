import { useState, useContext } from "react";
import Modal from "@/Components/Modal.jsx";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";
import axios from "axios";
import UserCard from "@/Components/UserCard.jsx";
import CustomScrollArea from "@/Components/CustomScrollArea.jsx";
import {
    UserCircleIcon,
} from '@heroicons/react/24/solid';
import {
    UsersIcon,
} from '@heroicons/react/24/outline'

const ALL_PERMISSIONS = [
    { key: 'change_roles_of_others', label: 'Change roles of others' },
    { key: 'delete_messages_of_others', label: 'Delete messages of others' },
    { key: 'change_chat_info', label: 'Change the chat\'s info (title)' },
    { key: 'add_remove_users', label: 'Add user / Delete user' },
    { key: 'set_auto_remove_timeout', label: 'Set auto-delete of messages' },
];

export default function ManageRolesModal({ chatRoom, onClose }) {
    const { setChatRooms } = useContext(ApplicationContext);
    const [currentView, setCurrentView] = useState('list');
    const [selectedUser, setSelectedUser] = useState(null);
    const [permissions, setPermissions] = useState([]);

    const onUserClick = (user) => {
        const pivotPerms = user?.pivot?.permissions || [];
        setSelectedUser(user);
        setPermissions([...pivotPerms]);
        setCurrentView('single');
    };

    const onCheckPermission = (permKey) => {
        setPermissions((prev) => {
            if (prev.includes(permKey)) {
                return prev.filter((p) => p !== permKey);
            } else {
                return [...prev, permKey];
            }
        });
    };

    const onBackToList = () => {
        setSelectedUser(null);
        setPermissions([]);
        setCurrentView('list');
    };

    const onSave = async () => {
        if (!selectedUser) return;
        try {
            const res = await axios.put(
                route('chat_rooms.manage_roles', {
                    chatRoom: chatRoom.id,
                    userToUpdate: selectedUser.id,
                }),
                { permissions }
            );
            setChatRooms(prev => prev.map(cr => {
                if (cr.id !== res.data.id) {
                    return cr;
                }

                const updatedUser = res.data.updated_user;

                const updatedUsers = cr.users.map(user =>
                    user.id === updatedUser.id
                        ? {
                            ...user,
                            pivot: {
                                ...user.pivot,
                                role_name: updatedUser.role_name,
                                permissions: updatedUser.permissions,
                            }
                        }
                        : user
                );

                return {
                    ...cr,
                    users: updatedUsers,
                };
            }));
            onBackToList();
        } catch (error) {
            console.error(error);
        }
    };

    const pivotRoleName = selectedUser?.pivot?.role_name ?? 'member';
    const isOwner = pivotRoleName === 'owner';

    const renderListView = () => {
        return (
            <>
                <div className="flex justify-between items-center mb-2">
                    <div className="text-lg flex items-center justify-center gap-1 font-semibold">
                        <UserCircleIcon className="size-6 pb-[2px]" />
                        Roles Manager
                    </div>
                    <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
                </div>
                <hr />

                <div className="mt-4">
                    <div className="flex items-center mb-2">
                        <UsersIcon className="size-5 mr-2" />
                        <div className="font-semibold">
                            Participants ({chatRoom?.users.length})
                        </div>
                    </div>
                    <CustomScrollArea className="h-64">
                        {chatRoom.users.map(u => {
                            const roleName = u.pivot.role_name;
                            const roleBadge = !roleName || roleName === 'member' ? '' : roleName;
                            return (
                                <UserCard
                                    key={u.id}
                                    user={u}
                                    showLastSeen={false}
                                    showRoleBadge={!!roleBadge}
                                    roleBadge={roleBadge}
                                    onClick={roleName === 'owner' ? null : () => onUserClick(u)}
                                />
                            );
                        })}
                    </CustomScrollArea>
                </div>
            </>
        );
    };

    const renderSingleView = () => {
        return (
            <>
                <div className="flex justify-between items-center mb-2">
                    <div className="text-lg flex items-center justify-center gap-1 font-semibold">
                        <UserCircleIcon className="size-6 pb-[2px]" />
                        Roles Manager
                    </div>
                    <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
                </div>
                <hr />
                <UserCard
                    key={selectedUser.id}
                    user={selectedUser}
                    showRoleBadge={!!selectedUser.pivot?.role_name}
                    roleBadge={selectedUser.pivot?.role_name}
                    className={"mt-4"}
                />
                <div className="mt-4">
                    {isOwner ? (
                        <div className="text-sm text-gray-700 mb-2">
                            This user is an Owner and cannot be changed.
                        </div>
                    ) : (
                        <div className="space-y-2 mb-4">
                            <div className="font-semibold">Permissions</div>
                            {ALL_PERMISSIONS.map((perm) => (
                                <label key={perm.key} className="flex items-center gap-2 ml-2">
                                    <input
                                        type="checkbox"
                                        checked={permissions.includes(perm.key)}
                                        onChange={() => onCheckPermission(perm.key)}
                                    />
                                    <span>{perm.label}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    <hr />
                    <div className="flex justify-between items-center gap-1 mt-3">
                        <button
                            className="flex-1 text-black bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded"
                            onClick={onBackToList}
                        >
                            Back
                        </button>
                        {!isOwner && (
                            <button
                                className="flex-1 text-blue-500 bg-blue-100 hover:bg-blue-200 px-4 py-2 rounded"
                                onClick={onSave}
                            >
                                Save
                            </button>
                        )}
                    </div>
                </div>
            </>
        );
    };

    return (
        <Modal show={true} onClose={onClose} maxWidth="md" className="p-5 w-full sm:max-w-md">
            <>
                {currentView === 'list' && renderListView()}
                {currentView === 'single' && renderSingleView()}
            </>
        </Modal>
    );
}
