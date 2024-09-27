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

            <h2 className={`my-2 text-center font-bold`}>Two-Factor Authentication</h2>

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="code" value="Code"/>

                    <TextInput
                        id="code"
                        type="text"
                        name="code"
                        value={data.code}
                        className="mt-1 block w-full"
                        isFocused={true}
                        onChange={(e) => setData('code', e.target.value)}
                    />

                    <InputError message={errors.code} className="mt-2"/>
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="recovery_code" value="Recovery Code"/>

                    <TextInput
                        id="recovery_code"
                        type="text"
                        name="recovery_code"
                        value={data.recovery_code}
                        className="mt-1 block w-full"
                        onChange={(e) => setData('recovery_code', e.target.value)}
                    />

                    <InputError message={errors.recovery_code} className="mt-2"/>
                </div>

                <div className="flex items-center justify-end mt-4">
                    <PrimaryButton className="ms-4" disabled={processing}>
                        Log in
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
