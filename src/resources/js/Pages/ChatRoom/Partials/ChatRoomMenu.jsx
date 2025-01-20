import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline/index.js";
import Checkbox from "@/Components/Checkbox.jsx";
import { useContext, useState, useEffect } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";
import axios from "axios";
import { router } from "@inertiajs/react";
import ChatRoomInfoModal from "./Modals/ChatRoomInfoModal.jsx";
import {
    InformationCircleIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
} from '@heroicons/react/24/outline';

export default function ChatRoomMenu({ chatRoom }) {
    const { safeViewIsOn, setSafeViewIsOn, chatRooms, setChatRooms } = useContext(ApplicationContext);

    const [menuIsHidden, setMenuIsHidden] = useState(true);
    const [showInfoModal, setShowInfoModal] = useState(false);

    const [isMuted, setIsMuted] = useState(chatRoom.muted);

    useEffect(() => {
        const updatedChatRoom = chatRooms.find(cr => cr.id === chatRoom.id);
        if (updatedChatRoom) {
            setIsMuted(updatedChatRoom.muted);
        }
    }, [chatRooms, chatRoom.id]);

    const toggleMenu = () => {
        setMenuIsHidden(!menuIsHidden);
    }

    const onShowInfo = () => {
        setShowInfoModal(true);
        setMenuIsHidden(true);
    }

    const onMutedClick = () => {
        axios.put(route('chat-rooms.muted.update', { chatRoom: chatRoom.id }), {
            muted: !isMuted,
        }).then(() => {
            setChatRooms(prev =>
                prev.map(cr => cr.id === chatRoom.id ? { ...cr, muted: !isMuted } : cr)
            );
        });
    }

    const onSafeViewChanged = (e) => {
        const safeViewIsOn = e.target.checked;

        axios.put(route('user-settings.update'), { safe_view_is_on: safeViewIsOn })
            .then(() => {
                setSafeViewIsOn(safeViewIsOn);
            });
    };

    return (
        <div className={`relative`}>
            <EllipsisHorizontalIcon
                className={`
                    size-8 border-2 border-white rounded-full p-1 text-white cursor-pointer hover:bg-blue-600
                `}
                onClick={toggleMenu}
            />

            <div className={`
                    absolute top-11 right-0 bg-blue-400 shadow-2xl whitespace-nowrap border-2 border-white text-white
                    rounded-lg z-40
                    ${menuIsHidden ? 'hidden' : ''}
                `}>
                <div className={`flex  flex-col gap-2 p-2`}>
                    <div
                        className={`p-2 select-none flex flex-nowrap gap-2 items-center`}>
                        <Checkbox
                            checked={safeViewIsOn}
                            onChange={onSafeViewChanged}
                        />
                        <span>Safe View</span>
                    </div>
                    <div
                        className="hover:bg-[#80B7FB] p-2 select-none cursor-pointer flex flex-nowrap gap-1 items-center rounded-lg"
                        onClick={onMutedClick}
                    >
                        {isMuted ? (
                            <>
                                <SpeakerWaveIcon className="size-6 pb-[2px]" />
                                Unmute
                            </>
                        ) : (
                            <>
                                <SpeakerXMarkIcon className="size-6 pb-[2px]" />
                                Mute
                            </>
                        )}

                    </div>
                    <div
                        className="hover:bg-[#80B7FB] p-2 select-none cursor-pointer flex flex-nowrap gap-1 items-center rounded-lg"
                        onClick={onShowInfo}
                    >
                        <InformationCircleIcon className="size-6 pb-[2px]" />
                        Info
                    </div>
                    {showInfoModal && (
                        <ChatRoomInfoModal
                            initialChatRoom={chatRoom}
                            onClose={() => setShowInfoModal(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
