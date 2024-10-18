import React, {useEffect, useRef, useState} from 'react'
import {MicrophoneIcon, TrashIcon} from '@heroicons/react/24/solid'
import {fixWebmDuration} from "@fix-webm-duration/fix";

export default function RecordAudioMessage({selectedFiles, setSelectedFiles}) {
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const audioChunks = useRef([]);
    const startTimeRef = useRef(null);

    useEffect(() => {
        if (isRecording) {
            navigator.mediaDevices.getUserMedia({audio: true})
                .then(stream => {
                    const mimeType = 'audio/webm';
                    const extension = mimeType.split('/')[1];
                    const recorder = new MediaRecorder(stream, {mimeType});

                    setMediaRecorder(recorder);

                    recorder.ondataavailable = event => {
                        audioChunks.current.push(event.data);
                    };

                    recorder.onstop = async () => {
                        const startTime = startTimeRef.current;
                        const duration = Date.now() - startTime;

                        const audioBlob = new Blob(audioChunks.current, {type: mimeType});
                        const audioBlobWithDuration = await fixWebmDuration(audioBlob, duration);
                        const audioFile = new File([audioBlobWithDuration], `voice_message.${extension}`, {type: mimeType});

                        audioChunks.current = [];
                        setSelectedFiles([audioFile]);
                    };

                    setSelectedFiles([]);
                    recorder.start();
                    startTimeRef.current = Date.now();
                })
                .catch(error => {
                    console.error('Error accessing microphone:', error);
                });
        } else if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        }
    }, [isRecording]);

    return (
        <div>
            <div
                className={`flex gap-2 ${isRecording ? "bg-red-500" : "bg-gray-200 hover:bg-indigo-600 hover:text-white"}
                  p-3 rounded-full`}>
                <MicrophoneIcon className="size-6 cursor-pointer" title='Record audio'
                                onClick={() => setIsRecording(!isRecording)}/>
                <TrashIcon title='Click to delete' onClick={() => setSelectedFiles([])}
                           className={`${selectedFiles.length > 0
                               ? 'size-6 cursor-pointer' : 'hidden'}`}>{selectedFiles.length}</TrashIcon>
            </div>
        </div>
    );
}
