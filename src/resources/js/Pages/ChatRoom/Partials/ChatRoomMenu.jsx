import {EllipsisVerticalIcon} from "@heroicons/react/24/outline/index.js";
import Checkbox from "@/Components/Checkbox.jsx";
import {useContext, useState} from "react";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";

export default function ChatRoomMenu() {
    const {safeViewIsOn, setSafeViewIsOn} = useContext(ApplicationContext);

    const [menuIsHidden, setMenuIsHidden] = useState(true);

    const toggleMenu = () => {
        setMenuIsHidden(!menuIsHidden);
    }

    const onSafeViewChanged = (e) => {
        const safeViewIsOn = e.target.checked;

        axios.put(route('user-settings.update'), {safe_view_is_on: safeViewIsOn})
            .then(() => {
                setSafeViewIsOn(safeViewIsOn);
            });
    };

    return (
        <div className={` relative`}>
            <EllipsisVerticalIcon
                className={`size-8 rounded-full p-1 hover:bg-indigo-600 hover:text-white cursor-pointer`}
                onClick={toggleMenu}
            />

            <div
                className={`absolute top-10 right-0 bg-gray-200 shadow-2xl whitespace-nowrap ${menuIsHidden ? 'hidden' : ''}`}>
                <div className={`hover:bg-gray-300 p-2`}>
                    <div className={`flex flex-nowrap gap-2 items-center`}>
                        <span>Safe View</span>

                        <Checkbox
                            checked={safeViewIsOn}
                            onChange={onSafeViewChanged}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
