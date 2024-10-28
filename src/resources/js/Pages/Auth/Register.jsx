import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import RSAKeysGenerator from '@/Encryption/RSAKeysGenerator.js';
import { useEffect, useState } from "react";
import UserRsaKeysStorage from "@/Common/UserRsaKeysStorage.js";
import UserPassword from "@/Common/UserPassword.js";

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        public_key: '',
    });

    const [publicKey, setPublicKey] = useState();
    const [privateKey, setPrivateKey] = useState();

    const [passErrors, setPassErrors] = useState({});

    const userRsaKeysStorage = new UserRsaKeysStorage();

    useEffect(() => {
        (async () => {
            const rsaGenerator = new RSAKeysGenerator();
            await rsaGenerator.generateKeys();

            const publicKey = await rsaGenerator.exportPublicKey();
            const privateKey = await rsaGenerator.exportPrivateKey();

            setPublicKey(publicKey);
            setPrivateKey(privateKey);

            setData('public_key', publicKey);
        })();
    }, []);


    const submit = (e) => {
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

        (async () => {
            userRsaKeysStorage.saveKeysToSessionStorage(publicKey, privateKey);
            await UserPassword.saveToSession(data.password, publicKey);
            await userRsaKeysStorage.saveKeysToLocalStorage(data.password, { publicKey, privateKey });
        })().then(() => {
            post(route('register'), {
                onFinish: () => reset('password', 'password_confirmation'),
            });
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password || passErrors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password_confirmation" value="Confirm Password" />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        required
                    />

                    <InputError message={errors.password_confirmation || passErrors.password_confirmation} className="mt-2" />
                </div>

                <input
                    type="hidden"
                    name="public_key"
                    value={data.public_key}
                    required
                />

                <div className="flex items-center justify-end mt-4">
                    <Link
                        href={route('login')}
                        className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Already registered?
                    </Link>

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Register
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
