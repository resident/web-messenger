import { useEffect, useRef, useState } from 'react';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';

export default function CustomAudioPlayer({
    src,
    fileSize = 0,
    width = 180,
    self = true,
}) {
    const audioRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [progressPercent, setProgressPercent] = useState(0);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }

        const audio = new Audio(src);
        audioRef.current = audio;

        const onLoadedMetadata = () => {
            setDuration(audio.duration || 0);
        };

        const onEnded = () => {
            setIsPlaying(false);
            audio.currentTime = 0;
            setCurrentTime(0);
            setProgressPercent(0);
        };

        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('ended', onEnded);
            audio.pause();
            audio.src = '';
        };
    }, [src]);

    useEffect(() => {
        let rafId;

        function animate() {
            if (!audioRef.current) return;
            const audio = audioRef.current;

            if (audio.ended || audio.paused) return;

            const ct = audio.currentTime;
            const dur = audio.duration || 1;

            setCurrentTime(ct);
            setProgressPercent((ct / dur) * 100);

            rafId = requestAnimationFrame(animate);
        }

        if (isPlaying && audioRef.current) {
            rafId = requestAnimationFrame(animate);
        }

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [isPlaying]);

    const prettySize = (bytes, decimals = 1) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    };

    const formatTime = (time) => {
        if (!time || isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    };

    const handlePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
        if (!audioRef.current || !duration) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const fraction = clickX / rect.width;
        const newTime = fraction * duration;

        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
        setProgressPercent(fraction * 100);
    };

    const renderTimeText = () => {
        const total = formatTime(duration);
        if (currentTime === 0 && !isPlaying) {
            return ` ${total}, ${prettySize(fileSize)} `;
        }
        const curr = formatTime(currentTime);
        return <span>{curr} / {total}</span>
    };

    return (
        <div
            className="flex items-center space-x-3 pr-3 pt-1 bg-transparent rounded-md w-auto max-w-max"
        >
            <button
                onClick={handlePlayPause}
                className={`min-w-10 w-10 min-h-10 h-10 flex items-center justify-center ${self ? 'bg-white text-blue-500' : 'bg-blue-200 text-[#073666]'} rounded-full`}
            >
                {isPlaying ? (
                    <PauseIcon className="w-5 h-5" />
                ) : (
                    <PlayIcon className="w-5 h-5 ml-0.5" />
                )}
            </button>

            <div className="flex flex-col space-y-1">
                <div
                    className="relative h-2 bg-blue-200 rounded cursor-pointer overflow-hidden"
                    style={{ width }}
                    onClick={handleSeek}
                >
                    <div
                        className="absolute left-0 top-0 h-2 bg-[#F5F9FE]"
                        style={{
                            width: `${progressPercent}%`,
                        }}
                    />
                </div>

                <div
                    className="text-xs text-white text-left whitespace-nowrap min-w-[80px]"
                >
                    {renderTimeText()}
                </div>
            </div>
        </div>
    );
}
