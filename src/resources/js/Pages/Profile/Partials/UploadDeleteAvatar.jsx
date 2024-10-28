import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import { useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { useState, useRef } from 'react';

export default function UploadDeleteAvatar({ className = '', user }) {
    const { data, setData, post, errors, recentlySuccessful } = useForm({
        avatar: null
    });

    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const[deletionSuccess, setDeletionSuccess] = useState(false);
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
            onFinish: () =>{ 
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
                <h2 className="text-lg font-medium text-gray-900">Upload Avatar</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Update your profile picture by uploading an avatar.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6" encType='multipart/form-data'>
                {user.avatar && (
                    <div className="mt-2">
                        <img src={`${import.meta.env.VITE_AVATARS_STORAGE}/${user.avatar.path}`} alt="Current Avatar" 
                        className="h-40 w-40 rounded-full" />
                    </div>
                )}
                <div>
                    <input
                        type="file"
                        id="avatar"
                        className="mt-1 block w-full"
                        onChange={(e) => setData('avatar', e.target.files[0])}
                        ref={fileInputRef}
                    />
                    <InputError className="mt-2" message={errors.avatar} />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={uploading}>Upload</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">Uploaded successfully.</p>
                    </Transition>
                </div>
                <div className="mt-2 flex items-center gap-4">
                    <PrimaryButton onClick={removeAvatar} disabled={deleting}>
                        Remove
                    </PrimaryButton>
                    <Transition
                        show={deletionSuccess}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">Deleted successfully.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
