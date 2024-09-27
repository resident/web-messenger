import InputLabel from "@/Components/InputLabel.jsx";
import TextInput from "@/Components/TextInput.jsx";
import InputError from "@/Components/InputError.jsx";
import PrimaryButton from "@/Components/PrimaryButton.jsx";
import {useRef, useState} from "react";
import DangerButton from "@/Components/DangerButton.jsx";
import SecondaryButton from "@/Components/SecondaryButton.jsx";

export default function TwoFactoAuthForm({className, ...props}) {
    const currentPasswordInput = useRef();

    const [currentPassword, setCurrentPassword] = useState("");
    const [processing, setProcessing] = useState(false);
    const [isEnabled, setIsEnabled] = useState(!!props.isEnabled);
    const [errors, setErrors] = useState({});
    const [step, setStep] = useState(1);
    const [info, setInfo] = useState({svg: '', url: '',});
    const [recoveryCodes, setRecoveryCodes] = useState([]);
    const [code, setCode] = useState('');
    const [showInfo, setShowInfo] = useState(false);

    const back = (e) => {
        e.preventDefault();

        setStep(step - 1);
    };

    const passwordConfirm = async () => {
        setErrors({});

        try {
            await axios.post(route('password.confirm'), {
                'password': currentPassword,
            });

            return true;
        } catch (e) {
            setErrors(e.response.data.errors);

            return false;
        } finally {
            setCurrentPassword('');
        }
    };

    const enableTwoFactorAuth = async (e) => {
        e.preventDefault();

        setProcessing(true);

        if (await passwordConfirm()) {
            try {
                await axios.post(route('two-factor.enable'));

                const response = await axios.get(route('two-factor.qr-code'));

                setInfo(response.data);
                setStep(2);

            } catch (e) {
                console.error(e);
            }
        }

        setProcessing(false);
    };

    const getRecoveryCodes = async (e) => {
        e.preventDefault();

        setProcessing(true);

        try {
            const response = await axios.get(route('two-factor.recovery-codes'));

            setRecoveryCodes(response.data);

            setStep(3);
        } catch (e) {
            console.error(e);
        }

        setProcessing(false);
    };

    const confirmTwoFactorAuth = async (e) => {
        e.preventDefault();

        try {
            await axios.post(route('two-factor.confirm'), {code});

            setIsEnabled(true);
            setStep(1);
        } catch (e) {
            setErrors(e.response.data.errors);
        }
    };

    const disableTwoFactorAuth = async (e) => {
        e.preventDefault();

        setProcessing(true);

        try {
            await axios.delete(route('two-factor.disable'));

            isEnabled(false);
        } catch (e) {
            setErrors({...errors, password: [e.response.data.message]});
        }

        setProcessing(false);
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h2>

                <p className="mt-1 text-sm text-gray-600">
                    Add an extra layer of security to your account by enabling two-factor authentication (2FA). After
                    activation, you will be required to provide an additional verification code from your mobile device
                    or authenticator app when logging in.
                </p>
            </header>

            <h2 className={`mt-3 text-lg font-medium text-gray-900 ${isEnabled && 'hidden'}`}>Step: {step}</h2>

            <div className={`mt-6 space-y-6 ${step !== 1 && 'hidden'}`}>
                <div>
                    <InputLabel htmlFor="password" value="Current Password"/>

                    <TextInput
                        id="password"
                        ref={currentPasswordInput}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                    />

                    {errors.password?.map((error, i) => (
                        <InputError key={i} message={error} className="mt-2"/>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    {isEnabled ?
                        (<DangerButton onClick={disableTwoFactorAuth} disabled={processing}>Disable</DangerButton>) :
                        (<PrimaryButton onClick={enableTwoFactorAuth} disabled={processing}>Enable</PrimaryButton>)
                    }
                </div>
            </div>

            <div className={`mt-6 space-y-6 ${step !== 2 && 'hidden'}`}>
                <a href={info.url}>
                    <span dangerouslySetInnerHTML={{__html: info.svg}}></span>
                </a>

                <p>Scan this two factor authentication QR code into their authenticator application</p>

                <button
                    className={`block font-bold text-blue-500 hover:text-blue-600`}
                    onClick={() => setShowInfo(!showInfo)}>
                    {showInfo ? 'Hide' : 'Show'} manual settings
                </button>

                <div className={!showInfo && 'hidden'}>
                    {info.url && [...new URL(info.url).searchParams].map((v, k) => (
                        <p key={k}>
                            <span className={`font-bold capitalize`}>{v[0]}:</span> {v[1]}
                        </p>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <SecondaryButton onClick={back} disabled={processing}>Back</SecondaryButton>
                    <PrimaryButton onClick={getRecoveryCodes} disabled={processing}>Next</PrimaryButton>
                </div>
            </div>

            <div className={`mt-6 space-y-6 ${step !== 3 && 'hidden'}`}>
                <div>
                    {recoveryCodes.map((recoveryCode, i) => (
                        <p key={i}>
                            <span className={`font-bold`}>{i + 1}:</span> {recoveryCode}
                        </p>
                    ))}
                </div>

                <p>Save your recovery codes</p>

                <div className="flex items-center gap-4">
                    <SecondaryButton onClick={back} disabled={processing}>Back</SecondaryButton>
                    <PrimaryButton onClick={() => setStep(4)} disabled={processing}>Next</PrimaryButton>
                </div>
            </div>

            <div className={`mt-6 space-y-6 ${step !== 4 && 'hidden'}`}>
                <div>
                    <InputLabel htmlFor="2fa_code" value="2FA Code"/>

                    <TextInput
                        id="2fa_code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        type="text"
                        className="mt-1 block w-full"
                    />

                    {errors.code?.map((error, i) => (
                        <InputError key={i} message={error} className="mt-2"/>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <SecondaryButton onClick={back} disabled={processing}>Back</SecondaryButton>
                    <PrimaryButton onClick={confirmTwoFactorAuth} disabled={processing}>Finish</PrimaryButton>
                </div>


            </div>
        </section>
    );
}
