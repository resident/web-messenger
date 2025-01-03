import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline/index.js";
import Checkbox from "@/Components/Checkbox.jsx";
import { useContext, useState } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext.jsx";
import axios from "axios";
import { router } from "@inertiajs/react";
import ChatRoomInfoModal from "./Modals/ChatRoomInfoModal.jsx";
import {
    InformationCircleIcon
} from '@heroicons/react/24/outline'

export default function ChatRoomMenu({ chatRoom }) {
    const { safeViewIsOn, setSafeViewIsOn } = useContext(ApplicationContext);

    const [menuIsHidden, setMenuIsHidden] = useState(true);
    const [showInfoModal, setShowInfoModal] = useState(false);

    const toggleMenu = () => {
        setMenuIsHidden(!menuIsHidden);
    }

    const onShowInfo = () => {
        setShowInfoModal(true);
        setMenuIsHidden(true);
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
                    absolute top-11 right-0 bg-blue-400 shadow-2xl whitespace-nowrap border-4 border-white text-white
                    rounded-lg z-40
                    ${menuIsHidden ? 'hidden' : ''}
                `}>
                <div className={`flex  flex-col gap-2 p-2`}>
                    <div
                        className={`bg-blue-800 hover:bg-blue-900 p-2 select-none flex flex-nowrap gap-2 items-center`}>
                        <span>Safe View</span>

                        <Checkbox
                            checked={safeViewIsOn}
                            onChange={onSafeViewChanged}
                        />
                    </div>
                    <div
                        className="bg-blue-800 hover:bg-blue-900 p-2 select-none cursor-pointer flex flex-nowrap gap-1 items-center"
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
