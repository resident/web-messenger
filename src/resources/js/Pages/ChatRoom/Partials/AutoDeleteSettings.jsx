import { ClockIcon } from "@heroicons/react/24/solid";
import { useContext, useEffect, useState } from "react";
import { ApplicationContext } from "@/Components/ApplicationContext";
import TextInput from "@/Components/TextInput.jsx";
import PrimaryButton from "@/Components/PrimaryButton.jsx";
import Select from "@/Components/Select.jsx";
import DangerButton from "@/Components/DangerButton.jsx";
import { ChatRoomContext } from "@/Pages/ChatRoom/ChatRoomContext.jsx";
import axios from "axios";

const timeUnits = Object.freeze({
    minute: 'minute',
    hour: 'hour',
    day: 'day',
    week: 'week',
});

export default function AutoDeleteSettings({
    chatRoom,
    mode = "inline",
    canManageAutoDelete = false,
    onClose = () => { },
}) {
    const { setChatRooms } = useContext(ApplicationContext);
    const [showSettings, setShowSettings] = useState(false);
    const [time, setTime] = useState(1);
    const [timeUnit, setTimeUnit] = useState(timeUnits.minute);
    const [currentTime, setCurrentTime] = useState(null);
    const [currentTimeUnit, setCurrentTimeUnit] = useState(timeUnit);
    const [showTime, setShowTime] = useState(false);

    const secondsInMinute = 60;
    const secondsInHour = 60 * secondsInMinute;
    const secondsInDay = 24 * secondsInHour;
    const secondsInWeek = 7 * secondsInDay;

    const secondsToTimeUnit = (seconds) => {
        const result = { time: null, timeUnit: timeUnits.minute };

        if (seconds === null) {
            return result;
        }

        if (seconds >= secondsInWeek && seconds % secondsInWeek === 0) {
            result.time = seconds / secondsInWeek;
            result.timeUnit = timeUnits.week;
        } else if (seconds >= secondsInDay && seconds % secondsInDay === 0) {
            result.time = seconds / secondsInDay;
            result.timeUnit = timeUnits.day;
        } else if (seconds >= secondsInHour && seconds % secondsInHour === 0) {
            result.time = seconds / secondsInHour;
            result.timeUnit = timeUnits.hour;
        } else if (seconds >= secondsInMinute && seconds % secondsInMinute === 0) {
            result.time = seconds / secondsInMinute;
            result.timeUnit = timeUnits.minute;
        }

        return result;
    };

    const timeUnitToSeconds = (time, timeUnit) => {
        time = Number(time);

        switch (timeUnit) {
            case timeUnits.minute:
                return time * secondsInMinute;
            case timeUnits.hour:
                return time * secondsInHour;
            case timeUnits.day:
                return time * secondsInDay;
            case timeUnits.week:
                return time * secondsInWeek;
            default:
                throw new Error('Unknown time unit');
        }
    };

    useEffect(() => {
        const { time, timeUnit } = secondsToTimeUnit(chatRoom?.auto_remove_timeout);

        setTime(time ?? 1);
        setTimeUnit(timeUnit);
        setCurrentTime(time);
        setCurrentTimeUnit(timeUnit);
        setShowTime(!!time);

    }, [chatRoom]);

    const toggleSettings = () => {
        setShowSettings(!showSettings);
    };

    const closeSettings = () => {
        setShowSettings(false);
        onClose();
    }

    const updateTimeOut = (timeout) => {
        axios.put(route('chat_rooms.update', [chatRoom.id]), {
            'auto_remove_timeout': timeout,
        }, {
            headers: {
                'X-Socket-ID': Echo.socketId(),
            }
        }
        ).then(response => {
            const auto_remove_timeout = response.data.auto_remove_timeout;

            setChatRooms(prev =>
                prev.map(cr =>
                    cr.id === chatRoom.id ? { ...cr, auto_remove_timeout } : cr
                )
            );
            closeSettings();
        });
    };

    const enable = (e) => {
        e.preventDefault();

        updateTimeOut(timeUnitToSeconds(time, timeUnit));
    };

    const disable = (e) => {
        e.preventDefault();

        updateTimeOut(null);

        setTime(1);
        setTimeUnit(timeUnits.minute);
    };

    const renderManageChat = () => {
        return (
            <div className="p-2 space-y-4 w-full text-center">
                <div className="flex justify-center">
                    <div className={`
                        w-20 h-20 rounded-full flex items-center justify-center
                        ${currentTime ? 'bg-blue-500 text-white' : 'bg-gray-400 text-gray-200'}
                    `}>
                        {currentTime
                            ? `${currentTime} ${currentTime === 1 ? currentTimeUnit : currentTimeUnit + 's'}`
                            : '-'
                        }
                    </div>
                </div>

                <div className="flex items-center gap-2 justify-center">
                    <TextInput
                        className="max-w-[6rem]"
                        type="number"
                        value={time}
                        min={1}
                        onChange={(e) => setTime(e.target.value < 1 ? 1 : e.target.value)}
                    />
                    <Select onChange={(e) => setTimeUnit(e.target.value)} value={timeUnit}>
                        {Object.keys(timeUnits).map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                        ))}
                    </Select>
                </div>

                <div className="flex gap-2 mt-2 justify-center">
                    <button
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                        onClick={closeSettings}
                    >
                        Back
                    </button>
                    <DangerButton onClick={enable}>Set</DangerButton>
                    <PrimaryButton onClick={disable}>Disable</PrimaryButton>
                </div>
            </div>
        );
    }

    const renderInline = () => {
        return (
            <div className="relative">
                <div
                    className={`absolute -right-[8rem] rounded-md p-3 shadow-md
                    ${showSettings ? 'block' : 'hidden'}
                    ${showTime ? 'bg-indigo-500' : 'bg-gray-200'}
                    ${!canManageAutoDelete && !showTime ? '-top-20' : !canManageAutoDelete && showTime ? '-top-28' : '-top-32'}
                `}
                >
                    {canManageAutoDelete ? (
                        <>
                            <div className="flex gap-2">
                                <TextInput
                                    className="max-w-24"
                                    type="number"
                                    value={time}
                                    min={1}
                                    onChange={(e) => setTime(e.target.value < 1 ? 1 : e.target.value)}
                                />
                                <Select onChange={(e) => setTimeUnit(e.target.value)} value={timeUnit}>
                                    {Object.keys(timeUnits).map(unit => (
                                        <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                </Select>
                            </div>

                            <div className="flex gap-2 justify-end mt-2 w-full">
                                <DangerButton onClick={enable}>Set</DangerButton>
                                <PrimaryButton onClick={disable}>Disable</PrimaryButton>
                            </div>
                        </>
                    ) : (
                        <div className="py-2 text-center min-w-[160px]">
                            {showTime ? (
                                <div className="text-white">
                                    <p className="font-semibold">
                                        Auto-Delete Active
                                    </p>
                                    <p>
                                        {currentTime}{' '}
                                        {currentTime === 1
                                            ? currentTimeUnit
                                            : `${currentTimeUnit}s`}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-gray-700 italic">
                                    <p>Auto-Delete disabled</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div
                    className={`
                    flex gap-2 hover:bg-indigo-600 hover:text-white cursor-pointer p-3 rounded-full relative
                    ${showTime ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-gray-200'}
                `}
                    onClick={toggleSettings}
                >
                    <ClockIcon className="size-6" />
                </div>
            </div>
        );
    }

    return (
        <>
            {mode === "manage_chat" && renderManageChat()}
            {mode === "inline" && renderInline()}
        </>
    )
}
