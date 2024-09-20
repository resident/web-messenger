import {PaperClipIcon} from "@heroicons/react/24/solid/index.js";
import {useEffect, useRef, useState} from "react";
import Modal from "@/Components/Modal.jsx";
import SecondaryButton from "@/Components/SecondaryButton.jsx";
import PrimaryButton from "@/Components/PrimaryButton.jsx";
import FileInput from "@/Components/FileInput.jsx";
import {TrashIcon} from "@heroicons/react/24/solid";

export default function SelectAttachments({selectedFiles, setSelectedFiles}) {
    const [showModal, setShowModal] = useState(false);
    const [showSelectedFiles, setShowSelectedFiles] = useState(false);

    const filesInputRef = useRef();

    useEffect(() => {
        if (selectedFiles.length === 0) {
            setShowSelectedFiles(false);
        }
    }, [selectedFiles]);

    const openModal = () => {
        setShowModal(true);
    }

    const close = () => {
        setSelectedFiles([]);
        setShowSelectedFiles(false);
        setShowModal(false);
    }

    const selectAttachments = () => {
        if (selectedFiles.length === 0) {
            close();
            return;
        }

        setShowSelectedFiles(true);
        setShowModal(false);
    };

    const addFiles = (e) => {
        setSelectedFiles([...selectedFiles, ...e.target.files]);

        e.target.value = '';
    };

    const removeFile = (i) => {
        setSelectedFiles(selectedFiles.filter((f, idx) => idx !== i));
    };

    return (
        <>
            <Modal
                show={showModal}
                onClose={() => {
                    setShowModal(false);
                }}
            >
                <div className={`p-4`}>
                    <h2 className={`py-3 font-bold`}>Select Attachments</h2>

                    <FileInput
                        ref={filesInputRef}
                        multiple={true}
                        onChange={addFiles}
                    />

                    <div>
                        {selectedFiles.map((file, i) => (
                            <div key={i} className={`flex gap-4 mt-3`}>
                                <div>
                                    <TrashIcon
                                        className={`size-6 text-red-400 cursor-pointer hover:text-red-600`}
                                        onClick={() => removeFile(i)}
                                    />
                                </div>

                                <div>
                                    {file.name}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 justify-end mt-3">
                        <PrimaryButton onClick={selectAttachments}>Select</PrimaryButton>
                        <SecondaryButton onClick={close}>Close</SecondaryButton>
                    </div>
                </div>

            </Modal>

            <div
                className={`
                    flex gap-2 bg-gray-200 hover:bg-indigo-600 hover:text-white cursor-pointer p-3 rounded-full
                    ${showSelectedFiles ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : ''}
                `}>
                <PaperClipIcon
                    className={`size-6`}
                    onClick={openModal}
                />

                <div className={`${showSelectedFiles ? 'pr-1' : 'hidden'}`}>{selectedFiles.length}</div>
            </div>
        </>

    );
}
