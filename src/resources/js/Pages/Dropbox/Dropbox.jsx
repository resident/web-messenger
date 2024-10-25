import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useEffect, useState, React } from 'react';
import DropboxClient from "@/Common/Dropbox.js";
import InputError from '@/Components/InputError';

export default function Dropbox({ auth }) {

    const [accessToken, setAccessToken] = useState(null)
    const [authError, setAuthError] = useState(null)

    const clientId = import.meta.env.VITE_DROPBOX_CLIENT_ID;
    const dropbox = new DropboxClient({clientId: clientId});
   
    useEffect(() =>{
        (async () => {
           let token = await dropbox.getAccessToken();
           setAccessToken(token)

            if(!token){

                const url = await dropbox.client.auth.getAuthenticationUrl(route('dropbox.auth'));
                const urlParams = new URLSearchParams(window.location.hash.replace('#', '?'));
                const error = urlParams.get('error');
                setAuthError(error)
                token = await dropbox.getAccessTokenFromUrl();
                
                if(!token && !error){
                    window.location.href = url;
                }
                
                if(token !== undefined){
                    await dropbox.setAccessToken(token);
                    setAccessToken(token)
                }
            }
        })(); 
    }, []);

    

    return (
        <AuthenticatedLayout
            user={auth.user}
            header="Dropbox"
        >
           <div className="flex justify-center">
                <div className="bg-white m-5 p-6 rounded-lg shadow-lg max-w-lg w-full">
                    <div className="flex gap-3 justify-center items-center">
                        {accessToken ? (
                            <h1 className="text-center">Dropbox Activated</h1> 
                        ) : ( <h1 className="text-center">{authError ? authError : "Authorizing"}</h1> )}
                    </div>
                    <InputError message='' className="mt-2" />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
