import Checkbox from '@/Components/Checkbox';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import {Head, Link, useForm} from '@inertiajs/react';
import UserRsaKeysStorage from "@/Common/UserRsaKeysStorage.js";
import UserPassword from "@/Common/UserPassword.js";

export default function Login({status, canResetPassword, canRegister}) {
    const {data, setData, post, processing, errors, reset} = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onSuccess: () => {
                sessionStorage.setItem('userKeysLoading', '1');

                (async () => {
                    const keysStorage = new UserRsaKeysStorage();
                    const keys = await keysStorage.getKeysFromBackend(data.password);

                    keysStorage.saveKeysToSessionStorage(keys.publicKey, keys.privateKey);

                    await Promise.all([
                        UserPassword.saveToSession(data.password, keys.publicKey),
                        keysStorage.saveKeysToLocalStorage(data.password, keys),
                    ]);
                })();
            },

            onFinish: () => reset('password'),
        });
    };


    return (
        <GuestLayout>
            <Head title="Log in"/>

            <h2 className="text-center font-bold text-blue-300 text-2xl">
                Sign In
            </h2>

            {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value="Email Address" className="!text-blue-300"/>

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full bg-sky-200"
                        placeholder="Email address"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2"/>
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" className="!text-blue-300"/>

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full bg-sky-200"
                        placeholder="Password"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2"/>
                </div>

                <div className="block mt-4">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        <span className="ms-2 text-sm text-blue-300">Remember me</span>
                    </label>
                </div>

                <div className="flex items-center justify-end mt-4">
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="underline text-sm text-blue-300  hover:text-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Forgot your password?
                        </Link>
                    )}

                    {canRegister && (
                        <Link
                            href={route('register')}
                            className="ml-3 underline text-sm text-blue-300 hover:text-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Register
                        </Link>
                    )}

                    <PrimaryButton
                        className="ms-4 !bg-blue-400 hover:!bg-blue-600 focus:!bg-blue-600 active:!bg-blue-600"
                        disabled={processing}>
                        Log in
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
