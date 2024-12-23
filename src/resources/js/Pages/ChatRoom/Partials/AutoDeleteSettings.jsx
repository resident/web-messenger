import {ClockIcon} from "@heroicons/react/24/solid";
import {useContext, useEffect, useState} from "react";
import TextInput from "@/Components/TextInput.jsx";
import PrimaryButton from "@/Components/PrimaryButton.jsx";
import Select from "@/Components/Select.jsx";
import DangerButton from "@/Components/DangerButton.jsx";
import {ChatRoomContext} from "@/Pages/ChatRoom/ChatRoomContext.jsx";

const timeUnits = Object.freeze({
    minute: 'minute',
    hour: 'hour',
    day: 'day',
    week: 'week',
});

export default function AutoDeleteSettings() {
    const {chatRoom} = useContext(ChatRoomContext);

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
        const result = {time: null, timeUnit: timeUnits.minute};

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
        const {time, timeUnit} = secondsToTimeUnit(chatRoom.auto_remove_timeout);

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
            const {time, timeUnit} = secondsToTimeUnit(response.data.auto_remove_timeout);

            setCurrentTime(time);
            setCurrentTimeUnit(timeUnit);
            setShowTime(!!time);

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

    return (
        <div className={`relative`}>
            <div
                className={`
                    absolute -top-32 -right-[8rem] bg-gray-200 rounded-md p-3 shadow-md
                    ${showSettings ? 'block' : 'hidden'}
                `}
            >
                <div className={`flex gap-2`}>
                    <TextInput
                        className={`max-w-24`}
                        type={`number`}
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

                <div className={`flex gap-2 justify-end mt-2 w-full`}>
                    <DangerButton onClick={enable}>Set</DangerButton>
                    <PrimaryButton onClick={disable}>Disable</PrimaryButton>
                </div>
            </div>

            <div
                className={`
                    flex gap-2 bg-gray-200 hover:bg-indigo-600 hover:text-white cursor-pointer p-3 rounded-full relative
                    ${showTime ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : ''}
                `}
                onClick={toggleSettings}
            >

                <ClockIcon
                    className={`size-6`}
                />

                <div
                    className={`${showTime ? 'pr-1' : 'hidden'}`}
                >
                    {currentTime} {currentTime === 1 ? currentTimeUnit : `${currentTimeUnit}s`}
                </div>
            </div>
        </div>
    )
}
