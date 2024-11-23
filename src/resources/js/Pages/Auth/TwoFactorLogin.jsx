import GuestLayout from '@/Layouts/GuestLayout';
import {Head, useForm} from "@inertiajs/react";
import InputLabel from "@/Components/InputLabel.jsx";
import TextInput from "@/Components/TextInput.jsx";
import InputError from "@/Components/InputError.jsx";
import PrimaryButton from "@/Components/PrimaryButton.jsx";

export default function TwoFactorLogin({status}) {
    const {data, setData, post, processing, errors, reset} = useForm({
        code: '',
        recovery_code: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('two-factor.login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Two-Factor Log in"/>

            {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

            <h2 className={`text-center font-bold text-blue-300 text-2xl`}>Two-Factor Authentication</h2>

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="code" value="Code" className="text-blue-300"/>

                    <TextInput
                        id="code"
                        type="text"
                        name="code"
                        value={data.code}
                        placeholder="Code"
                        className="mt-1 block w-full bg-sky-200"
                        isFocused={true}
                        onChange={(e) => setData('code', e.target.value)}
                    />

                    <InputError message={errors.code} className="mt-2"/>
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="recovery_code" value="Recovery Code" className="text-blue-300"/>

                    <TextInput
                        id="recovery_code"
                        type="text"
                        name="recovery_code"
                        value={data.recovery_code}
                        placeholder="Recovery Code"
                        className="mt-1 block w-full bg-sky-200"
                        onChange={(e) => setData('recovery_code', e.target.value)}
                    />

                    <InputError message={errors.recovery_code} className="mt-2"/>
                </div>

                <div className="flex items-center justify-end mt-4">
                    <PrimaryButton className="ms-4 bg-blue-400 hover:bg-blue-600 focus:bg-blue-600 active:bg-blue-600"
                                   disabled={processing}>
                        Log in
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
