import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Link, useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import TextInputEdit from "@/Components/TextInputEdit.jsx";
import { useRef } from 'react';
import { CameraIcon } from '@heroicons/react/24/solid';

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        last_name: '',
        username: '',
        email: user.email,
    });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={`flex flex-col items-center  min-h-screen ${className}`}>

            <h2 className="text-lg font-medium text-gray-900">Edit Profile</h2>
            <header className="text-center">

            <div className="relative w-32 h-32 overflow-hidden rounded-full mx-auto">
                <img 
                    src="https://i.scdn.co/image/ab6761610000517456d2d8d16ddedbf61b1c74f0" 
                    alt="Rounded Image" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <CameraIcon className="w-8 h-8 text-white" />
                </div>
            </div>

            </header>

            <form onSubmit={submit} className="mt-6 space-y-6 w-full max-w-md">
                
                <div className='space-y-6'>
                    <div>
                        <TextInputEdit
                            id="name"
                            title="First name (required)"
                            className="mt-1 block w-full"
                            value={data.name}
                            onChange={(e) => {
                                setData('name', e.target.value);
                            }}
                            required
                            isFocused
                            autoComplete="name"
                        />

                        <InputError className="mt-2" message={errors.name}/>
                    </div>

                    <div>
                        <TextInputEdit
                            id="last-name"
                            title="Last name (optional)"
                            className="mt-1 block w-full"
                            value={data.last_name}
                            onChange={(e) => setData('last_name', e.target.value)}
                            isFocused
                            autoComplete="name"
                        />

                        <InputError className="mt-2" message={errors.name}/>
                    </div>
                </div>
                
                
                <div className='space-y-4'>
                    <h4>Username</h4>
                    <TextInputEdit
                        id="username"
                        title="Username"
                        className="mt-1 block w-full"
                        value={data.username}
                        onChange={(e) => setData('username', e.target.value)}
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name}/>
                </div>


                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="text-sm mt-2 text-gray-800">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 font-medium text-sm text-green-600">
                                A new verification link has been sent to your email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">Saved.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
