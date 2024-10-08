import UserRsaKeysStorage from "@/Common/UserRsaKeysStorage.js";
import {useContext, useEffect, useRef, useState} from "react";
import InputLabel from "@/Components/InputLabel.jsx";
import TextInput from "@/Components/TextInput.jsx";
import PrimaryButton from "@/Components/PrimaryButton.jsx";
import InputError from "@/Components/InputError.jsx";
import UserPassword from "@/Common/UserPassword.js";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";
import {router} from "@inertiajs/react";
import SecondaryButton from "@/Components/SecondaryButton.jsx";
import SyncProvider from "@/Sync/SyncProvider.js";
import LocalStorageDriver from "@/Sync/Drivers/LocalStorageDriver.js";
import BackendDriver from "@/Sync/Drivers/BackendDriver.js";

export default function loadUserRsaKeys() {
    const {
        userPublicKey, setUserPublicKey,
        userPrivateKey, setUserPrivateKey,
        sessionLocked, setSessionLocked,
    } = useContext(ApplicationContext);

    const userRsaKeysStorage = new UserRsaKeysStorage();

    const [keysLoaded, setKeysLoaded] = useState(userRsaKeysStorage.hasKeysInSessionStorage());
    const [keysAvailable, setKeysAvailable] = useState(userRsaKeysStorage.hasKeysInLocalStorage());
    const [userPassword, setUserPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const passwordInput = useRef();

    useEffect(() => {
        setSessionLocked(!keysLoaded);
    }, [keysLoaded]);

    const syncUserRsaKeys = async () => {
        setLoading(true);

        const syncProvider = new SyncProvider([
            new LocalStorageDriver(),
            new BackendDriver()
        ]);

        await syncProvider.sync('userRsaKeys');

        setLoading(false);
    };

    useEffect(() => {
        if (!keysAvailable) {
            syncUserRsaKeys().then(() => {
                if (userRsaKeysStorage.hasKeysInLocalStorage()) {
                    setKeysAvailable(true);
                }
            });
        }
    }, [keysAvailable]);

    useEffect(() => {
        try {
            if (!userPublicKey || !userPrivateKey) {
                const userRsaKeysStorage = new UserRsaKeysStorage();

                const {publicKey, privateKey} = userRsaKeysStorage.getKeysFromSession();

                setUserPublicKey(publicKey);
                setUserPrivateKey(privateKey);

                if (publicKey && privateKey) {
                    setKeysLoaded(true);
                }
            } else {
                setKeysLoaded(true);
            }
        } catch (e) {
            setKeysLoaded(false);
        }

    }, [userPublicKey, userPrivateKey]);

    useEffect(() => {
        setError('');
    }, [userPassword]);

    const unlock = () => {
        if (!keysAvailable) {
            setError(`You don't have keys on this device`);
            return;
        }

        (async () => {
            try {
                const {publicKey, privateKey} = await userRsaKeysStorage.getKeysFromLocalStorage(userPassword);

                await UserPassword.saveToSession(userPassword, publicKey);

                userRsaKeysStorage.saveKeysToSessionStorage(publicKey, privateKey);

                setKeysLoaded(true);

                setUserPublicKey(publicKey);
                setUserPrivateKey(privateKey);
            } catch (e) {
                setError('Invalid password, try again');
                passwordInput.current.focus();
            } finally {
                passwordInput.current.value = '';
            }
        })();
    };

    return (
        <div
            className={`
                fixed z-60 inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center
                ${keysLoaded ? 'hidden' : ''}
            `}
        >
            <div className="bg-white m-5 p-6 rounded-lg shadow-lg max-w-lg w-full">
                <h2 className="text-2xl font-semibold mb-4">Unlock session</h2>

                <InputLabel htmlFor="password" value="Password"/>

                <div className="flex gap-3 justify-start items-center">
                    <TextInput
                        id="password"
                        ref={passwordInput}
                        onChange={(e) => setUserPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && unlock()}
                        type="password"
                        className="mt-1 block w-1/2"
                    />

                    <PrimaryButton onClick={unlock} disabled={userPassword.length === 0}>Unlock</PrimaryButton>
                    <SecondaryButton onClick={() => router.post(route('logout'))}>Log Out</SecondaryButton>
                </div>

                <InputError message={error} className="mt-2"/>
            </div>
        </div>
    );
}
