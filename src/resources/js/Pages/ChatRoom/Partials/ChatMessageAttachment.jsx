import {useContext, useEffect, useState} from "react";
import {ChatRoomContext} from "@/Pages/ChatRoom/ChatRoomContext.jsx";
import AESEncryptor from "@/Encryption/AESEncryptor.js";
import ProgressBar from "@/Components/ProgressBar.jsx";

export default function ChatMessageAttachmentAttachment({attachment}) {
    const {chatRoomKey} = useContext(ChatRoomContext);

    const [type, setType] = useState(attachment.mime_type.split('/')[0]);
    const [preloadTypes, setPreloadTypes] = useState(['image', 'audio', 'video']);
    const [attachmentContent, setAttachmentContent] = useState(null);
    const [attachmentUrl, setAttachmentUrl] = useState();
    const [render, setRender] = useState();
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [manualDownload, setManualDownload] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (preloadTypes.includes(type)) {
            downloadAttachment();
        }
    }, []);

    useEffect(() => {
        if (manualDownload && attachmentUrl) {
            console.log('attachmentUrl', attachmentUrl);

            const a = document.createElement('a');
            a.href = attachmentUrl;
            a.download = attachment.name;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setManualDownload(false);
        }
    }, [manualDownload, attachmentUrl]);


    const downloadAttachment = () => {
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
        return URL.createObjectURL(new Blob([content], {type: attachment.type}));
    }

    const prettySize = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    };

    const renderImage = () => {
        return (
            <img
                src={attachmentUrl}
                alt={attachment.name}
                onClick={() => {
                    window.open(attachmentUrl);
                }}
            />
        );
    };

    const renderAudio = () => {
        return (
            <audio
                src={attachmentUrl}
                controls={true}
            />
        );
    };

    const renderVideo = () => {
        return (
            <video
                src={attachmentUrl}
                controls={true}
            />
        );
    };

    const downloadHandler = () => {
        setManualDownload(true);
        downloadAttachment();
    };

    const renderDownloadButton = () => {
        return (
            <div>
                <button
                    className={`text-blue-500 font-bold hover:text-blue-700`}
                    onClick={downloadHandler}
                >{attachment.name}</button>
                <div className={`text-xs`}>{prettySize(attachment.size)}</div>
            </div>
        );

    };

    const renderAttachment = () => {
        switch (type) {
            case 'image':
                return renderImage();
            case 'audio':
                return renderAudio();
            case 'video':
                return renderVideo();
            default:
                return renderDownloadButton();
        }
    };

    useEffect(() => {
        setRender(renderAttachment());
    }, [attachmentContent]);

    return (
        <div className={`m-1 p-2 bg-blue-100 rounded-md`} onClick={() => setShowModal(true)}>
            {render}


            <ProgressBar
                className={`
                    mt-2
                    ${loadingProgress === 100 ? 'hidden' : ''}
                `}
                progress={loadingProgress}
            />
        </div>)
}
