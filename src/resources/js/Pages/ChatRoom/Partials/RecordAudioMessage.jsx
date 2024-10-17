import React, { useRef, useState, useEffect } from 'react'
import { MicrophoneIcon, TrashIcon } from '@heroicons/react/24/solid'

export default function RecordAudioMessage({ selectedFiles, setSelectedFiles }) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunks = useRef([]);

  useEffect(() => {
    if (isRecording) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const recorder = new MediaRecorder(stream);
          setMediaRecorder(recorder);

          recorder.ondataavailable = event => {
            audioChunks.current.push(event.data);
          };

          recorder.onstop = () => {
            const audioBlob = new Blob(audioChunks.current, { type: 'audio/ogg' });
            const audioFile = new File([audioBlob], `voice_message_${Date.now()}`, { type: "audio/ogg" });

            audioChunks.current = [];
            setSelectedFiles([audioFile]);
          };
          setSelectedFiles([]);
          recorder.start();
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
                  p-3 rounded-full`} >
        <MicrophoneIcon className="size-6 cursor-pointer" title='Record audio' onClick={() => setIsRecording(!isRecording)} />
        <TrashIcon title='Click to delete' onClick={() => setSelectedFiles([])} className={`${selectedFiles.length > 0
          ? 'size-6 cursor-pointer' : 'hidden'}`}>{selectedFiles.length}</TrashIcon>
      </div>
    </div>
  );
}
