import {useContext, useRef, useState} from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import {useForm} from '@inertiajs/react';
import {Transition} from '@headlessui/react';
import UserRsaKeysStorage from "@/Common/UserRsaKeysStorage.js";
import UserPassword from "@/Common/UserPassword.js";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";

export default function UpdatePasswordForm({className = ''}) {
    const {syncProvider} = useContext(ApplicationContext);
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {data, setData, errors, put, reset, processing, recentlySuccessful} = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [passErrors, setPassErrors] = useState({});

    const onPasswordUpdated = async (newPassword) => {
        const keyStorage = new UserRsaKeysStorage();
        const keys = keyStorage.getKeysFromSession();

        await Promise.all([
            UserPassword.saveToSession(newPassword, keys.publicKey),
            keyStorage.saveKeysToLocalStorage(newPassword, keys),
        ]);

        await syncProvider.sync('userRsaKeys');

        reset();
    };

    const updatePassword = (e) => {
        e.preventDefault();

        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

        let hasError = false
        const newPassErrors = {};
        if (!passwordPattern.test(data.password)) {
            newPassErrors.password = 'The password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number.';
            hasError = true;
        }
        if (data.password !== data.password_confirmation) {
            newPassErrors.password_confirmation = 'Passwords do not match.';
            hasError = true;
        }

        setPassErrors(newPassErrors);

        if (hasError) {
            return;
        }

        put(route('user-password.update'), {
            preserveScroll: true,
            onSuccess: () => onPasswordUpdated(data.password),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium">Update Password</h2>

                <p className="mt-1 text-sm">
                    Ensure your account is using a long, random password to stay secure.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-6">
                <div>
                    <InputLabel className={`text-white`} htmlFor="current_password" value="Current Password"/>

                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                    />

                    <InputError message={errors.current_password} className="mt-2"/>
                </div>

                <div>
                    <InputLabel className={`text-white`} htmlFor="password" value="New Password"/>

                    <TextInput
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                    />

                    <InputError message={errors.password || passErrors.password} className="mt-2"/>
                </div>

                <div>
                    <InputLabel className={`text-white`} htmlFor="password_confirmation" value="Confirm Password"/>

                    <TextInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                    />

                    <InputError message={errors.password_confirmation || passErrors.password_confirmation}
                                className="mt-2"/>
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton className={`!bg-blue-400 hover:!bg-blue-600`}
                                   disabled={processing}>Save</PrimaryButton>

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
