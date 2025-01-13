import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import {useForm} from '@inertiajs/react';
import {Transition} from '@headlessui/react';
import {useRef, useState} from 'react';

export default function UploadDeleteAvatar({className = '', user}) {
    const {data, setData, post, errors, recentlySuccessful} = useForm({
        avatar: null
    });

    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletionSuccess, setDeletionSuccess] = useState(false);
    const fileInputRef = useRef(null);

    const submit = (e) => {
        e.preventDefault();
        setUploading(true);

        const formData = new FormData();
        if (data.avatar) {
            formData.append('avatar', data.avatar);
        }

        post(route('avatar.update'), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                setUploading(false)
                fileInputRef.current.value = '';
            },
        });
    };

    const removeAvatar = async () => {
        setDeleting(true);

        try {
            await axios.delete(route('avatar.delete'));
            setDeletionSuccess(true);
            setTimeout(() => setDeletionSuccess(false), 2000);
        } catch (error) {
            console.error('Error deleting avatar:', error);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-white">Upload Avatar</h2>
                <p className="mt-1 text-sm text-white">
                    Update your profile picture by uploading an avatar.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6" encType='multipart/form-data'>
                {user.avatar && (
                    <div className="mt-2">
                        <img src={`${import.meta.env.VITE_AVATARS_STORAGE}/${user.avatar.path}`} alt="Current Avatar"
                             className="h-40 w-40 rounded-full"/>
                    </div>
                )}

                <div>
                    <input
                        type="file"
                        id="avatar"
                        className="mt-1 block w-full bg-blue-800 text-white"
                        onChange={(e) => setData('avatar', e.target.files[0])}
                        ref={fileInputRef}
                    />
                    <InputError className="mt-2" message={errors.avatar}/>
                </div>

                <div className={`flex gap-2`}>
                    <div className="flex items-center gap-4">
                        <PrimaryButton className={`!bg-blue-400 hover:!bg-blue-600`}
                                       disabled={uploading}>Upload</PrimaryButton>

                        <Transition
                            show={recentlySuccessful}
                            enter="transition ease-in-out"
                            enterFrom="opacity-0"
                            leave="transition ease-in-out"
                            leaveTo="opacity-0"
                        >
                            <p className="text-sm">Uploaded successfully.</p>
                        </Transition>
                    </div>

                    <div className="flex items-center gap-4">
                        <PrimaryButton className={`!bg-blue-400 hover:!bg-blue-600`}
                                       onClick={removeAvatar} disabled={deleting}>
                            Remove
                        </PrimaryButton>
                        <Transition
                            show={deletionSuccess}
                            enter="transition ease-in-out"
                            enterFrom="opacity-0"
                            leave="transition ease-in-out"
                            leaveTo="opacity-0"
                        >
                            <p className="text-sm">Deleted successfully.</p>
                        </Transition>
                    </div>
                </div>

            </form>
        </section>
    );
}
