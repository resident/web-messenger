import UserRsaKeysStorage from "@/Common/UserRsaKeysStorage.js";
import {useRef, useState} from "react";
import InputLabel from "@/Components/InputLabel.jsx";
import TextInput from "@/Components/TextInput.jsx";
import PrimaryButton from "@/Components/PrimaryButton.jsx";
import InputError from "@/Components/InputError.jsx";

export default function loadUserRsaKeys() {
    const userRsaKeysStorage = new UserRsaKeysStorage();
    const [keysLoaded, setKeysLoaded] = useState(userRsaKeysStorage.hasKeysInSessionStorage());
    const [keysAvailable, setKeysAvailable] = useState(userRsaKeysStorage.hasKeysInLocalStorage());
    const [userPassword, setUserPassword] = useState('');
    const [error, setError] = useState('');
    const passwordInput = useRef();

    const unlock = () => {
        if (!keysAvailable) return;

        (async () => {
            try {
                const {publicKey, privateKey} = await userRsaKeysStorage.getKeysFromLocalStorage(userPassword);

                userRsaKeysStorage.saveKeysToSessionStorage(publicKey, privateKey);

                setKeysLoaded(true);
            } catch (e) {
                setError('Invalid password, try again');
                passwordInput.current.value = '';
                passwordInput.current.focus();
            }
        })();
    };

    return (
        <div
            className={`
                fixed z-50 inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center
                ${keysLoaded ? 'hidden' : ''}
            `}
        >
            <div className="bg-white m-5 p-6 rounded-lg shadow-lg max-w-lg w-full">
                <h2 className="text-2xl font-semibold mb-4">Unlock session</h2>

                <InputLabel htmlFor="password" value="Password"/>

                <div className="flex gap-3 justify-center items-center">
                    <TextInput
                        id="password"
                        ref={passwordInput}
                        onChange={(e) => setUserPassword(e.target.value)}
                        type="password"
                        className="mt-1 block w-full"
                    />

                    <PrimaryButton onClick={unlock} disabled={userPassword.length === 0}>Unlock</PrimaryButton>
                </div>

                <InputError message={error} className="mt-2"/>
            </div>
        </div>
    );
}
