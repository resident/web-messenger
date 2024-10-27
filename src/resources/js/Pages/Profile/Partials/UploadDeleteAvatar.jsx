import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import { useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';

export default function UploadDeleteAvatar({ className = '' }) {
    const user = usePage().props.auth.user;

    const { data, setData, post, errors, processing, recentlySuccessful } = useForm({
        avatar: null
    });

    const submit = (e) => {
        e.preventDefault();

        const formData = new FormData();
        if (data.avatar) {
            formData.append('avatar', data.avatar);
        }

        post(route('avatar.update'), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
        });
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
                <div>
                    <InputLabel htmlFor="avatar" value="Avatar" />
                    <input
                        type="file"
                        id="avatar"
                        className="mt-1 block w-full"
                        onChange={(e) => setData('avatar', e.target.files[0])}
                    />
                    <InputError className="mt-2" message={errors.avatar} />
                    
                    {/* Display current avatar */}
                    {user.avatar && (
                        <div className="mt-2">
                            <img src={`/storage/avatars/${user.avatar}`} alt="Current Avatar" className="h-20 w-20 rounded-full" />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Upload</PrimaryButton>

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
            </form>
        </section>
    );
}
