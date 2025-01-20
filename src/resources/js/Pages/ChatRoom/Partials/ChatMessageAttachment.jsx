import { useContext, useEffect, useState } from "react";
import { ChatRoomContext } from "@/Pages/ChatRoom/ChatRoomContext.jsx";
import AESEncryptor from "@/Encryption/AESEncryptor.js";
import ProgressBar from "@/Components/ProgressBar.jsx";
import Modal from "@/Components/Modal.jsx";
import CustomAudioPlayer from "@/Components/CustomAudioPlayer";

export default function ChatMessageAttachment({ attachment, self }) {
    const { chatRoomKey } = useContext(ChatRoomContext);

    const [type, setType] = useState(attachment.mime_type.split('/')[0]);
    const [preloadTypes, setPreloadTypes] = useState(['image', 'audio', 'video']);
    const [attachmentContent, setAttachmentContent] = useState(null);
    const [attachmentUrl, setAttachmentUrl] = useState();
    const [render, setRender] = useState();
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [showLoadingProgress, setShowLoadingProgress] = useState(false);
    const [manualDownload, setManualDownload] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (preloadTypes.includes(type)) {
            downloadAttachment();
        }
    }, []);

    useEffect(() => {
        if (manualDownload && attachmentUrl) {
            const a = document.createElement('a');
            a.href = attachmentUrl;
            a.download = attachment.name;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setManualDownload(false);
            setShowLoadingProgress(false);
        }
    }, [manualDownload, attachmentUrl]);


    const downloadAttachment = () => {
        if (attachmentContent) return;

        axios.get(route('chat_rooms.messages.download_attachment', [attachment.id]), {
            responseType: 'arraybuffer',
            onDownloadProgress: (progressEvent) => {
                const totalLength = progressEvent.total;

                if (totalLength !== null) {
                    const progress = Math.round((progressEvent.loaded * 100) / totalLength);

                    setLoadingProgress(progress);
                }
            }
        }).then((response) => {
            decryptAttachment(response.data).then((content) => {
                setAttachmentContent(content);
                setAttachmentUrl(getAttachmentUrl(content));
            });
        });
    };

    const decryptAttachment = async (encrypted) => {
        const aesEncryptor = new AESEncryptor();
        await aesEncryptor.importKey(chatRoomKey);
        const attachmentKey = await aesEncryptor.decryptString(attachment.attachment_key, attachment.attachment_key_iv);
        await aesEncryptor.importKey(attachmentKey);

        return await aesEncryptor.decryptRaw(encrypted, attachment.attachment_iv);
    };

    const getAttachmentUrl = (content) => {
        return URL.createObjectURL(new Blob([content], { type: attachment.type }));
    }

    const prettySize = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    };

    const renderImageModal = () => (
        <Modal
            className={`p-3 sm:max-w-fit`}
            show={showModal}
            onClose={() => setShowModal(false)}>

            <div className={`flex justify-center`}>
                <img
                    className={`w-full max-w-full max-h-[80vh] object-contain`}
                    src={attachmentUrl}
                    alt={attachment.name}
                    onClick={() => setShowModal(false)}
                />
            </div>

            {renderAttachmentInfo(true, true)}
        </Modal>
    );

    const renderImage = () => (
        <img
            className={`cursor-pointer`}
            src={attachmentUrl}
            alt={attachment.name}
            onClick={() => {
                setShowModal(true)
            }}
        />
    );

    const renderAudio = () => (
        <CustomAudioPlayer src={attachmentUrl} fileSize={attachment.size} width={170} self={self} />
    );

    const renderVideo = () => (
        <video
            src={attachmentUrl}
            controls={true}
        />
    );

    const downloadHandler = () => {
        setManualDownload(true);
        setShowLoadingProgress(true);
        downloadAttachment();
    };

    const renderAttachmentInfo = (isModal = false, showSize = true) => {
        if (!showSize) return null;

        return (<div className={`mt-2 text-sm ${isModal ? 'text-gray-800' : 'text-gray-300'}`}>
            <div
                className={`cursor-pointer ${isModal ? 'text-blue-500 hover:text-blue-600' : 'text-gray-200 hover:text-white'} font-bold`}
                onClick={downloadHandler}>{attachment.name}</div>
            {showSize && (<div>{prettySize(attachment.size)}</div>)}
        </div>)
    };

    const renderAttachment = () => {
        let jsx;

        switch (type) {
            case 'image':
                jsx = renderImage();
                break;
            case 'audio':
                jsx = renderAudio();
                break;
            case 'video':
                jsx = renderVideo();
                break;
        }

        return (
            <>
                <div className="rounded-md overflow-hidden">
                    {jsx}
                </div>
                {renderAttachmentInfo(false, (type !== 'audio'))}
            </>
        );
    };

    useEffect(() => {
        setRender(renderAttachment());
    }, [attachmentContent]);

    return (
        <div>
            {type === 'image' && renderImageModal()}

            {render}

            <ProgressBar
                className={`
                    mt-2
                    ${showLoadingProgress || 'hidden'}
                `}
                progress={loadingProgress}
            />
        </div>
    )
}
