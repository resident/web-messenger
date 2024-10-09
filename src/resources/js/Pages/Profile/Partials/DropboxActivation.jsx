import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import DropboxClient from "@/Common/Dropbox.js";
import DangerButton from '@/Components/DangerButton';

export default function DropboxSyncSection() {

    const [accessToken, setAccessToken] = useState(null);
    const clientId = 'ak7n1xcwor288r3';
    const dropbox = new DropboxClient({ clientId: clientId });

    useEffect(() => {
        (async () => {
            let token = await dropbox.getAccessToken();
            setAccessToken(token);
        })();
    }, []);

    const disableSync = async () => {
        
        dropbox.removeAccessToken();
        setAccessToken(null);
    };

    return (
        <section className="space-y-6">
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Dropbox Sync
                </h2>

                {accessToken ? (
                    <p className="mt-1 text-sm text-gray-600">
                        Dropbox sync is currently enabled. You can disable it below.
                    </p>
                ) : (
                    <p className="mt-1 text-sm text-gray-600">
                        Dropbox sync is disabled. Enable it to sync your data.
                    </p>
                )}
            </header>

            {accessToken ? (
                <>
                    <DangerButton onClick={disableSync}>Disable Dropbox Sync</DangerButton>
                </>
            ) : (
                <Link
                    href={route('dropbox.auth')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-500 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition ease-in-out duration-150"
                >
                    Enable Dropbox Sync
                </Link>
            )}
        </section>
    );
}