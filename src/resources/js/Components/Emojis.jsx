import {FaceSmileIcon} from "@heroicons/react/24/solid";
import {useState} from "react";

export default function Emojis({onSmileSelected: onEmojiSelected = (emoji) => null}) {
    const [showSmiles, setShowSmiles] = useState(false);

    const toggleShowSmiles = () => {
        setShowSmiles(!showSmiles);
    }

    function* getEmojis() {
        const ranges = [
            [0x1F600, 0x1F64F],
            [0x1F300, 0x1F5FF],
            [0x1F680, 0x1F6FF],
            [0x2600, 0x26FF],
            [0x2700, 0x27BF],
        ];

        for (const range of ranges) {
            for (let i = range[0]; i <= range[1]; i++) {
                yield String.fromCodePoint(i);
            }
        }
    }

    const renderEmojis = () => {
        const emojis = getEmojis();
        const emojiElements = [];

        for (const emoji of emojis) {
            emojiElements.push(
                <button
                    key={emoji}
                    className={`text-2xl`}
                    onClick={() => {
                        onEmojiSelected(emoji);
                    }}
                >{emoji}</button>
            );
        }

        return emojiElements;
    };

    return (
        <div className={`relative`}>
            <div
                className={`
                    absolute -top-[21rem] -left-0 bg-gray-200 rounded-md p-3 shadow-md overflow-y-auto w-64 h-64
                    ${showSmiles ? 'block' : 'hidden'}
                `}
            >
                <div className={`flex gap-2 flex-wrap`}>
                    {renderEmojis()}
                </div>

            </div>

            <div
                className={`
                    flex gap-2 bg-gray-200 hover:bg-indigo-600 hover:text-white cursor-pointer p-3 rounded-full relative
                    ${showSmiles && 'bg-indigo-500 hover:bg-indigo-600 text-white'}
                `}
                onClick={toggleShowSmiles}
            >
                <FaceSmileIcon className={`size-6`}/>
            </div>
        </div>
    );
}
