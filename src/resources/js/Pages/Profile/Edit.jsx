import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import DropboxActivation from './Partials/DropboxActivation';
import {Head} from '@inertiajs/react';
import TwoFactoAuthForm from "@/Pages/Profile/Partials/TwoFactoAuthForm.jsx";
import UploadDeleteAvatar from './Partials/UploadDeleteAvatar';

export default function Edit({auth, mustVerifyEmail, status}) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header="Profile"
        >
            <Head title="Profile"/>

            <div className="p-3 max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                    <UploadDeleteAvatar className="max-w-xl" user={auth.user}/>
                </div>
                <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                    <UpdatePasswordForm className="max-w-xl"/>
                </div>

                <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                    <TwoFactoAuthForm
                        isEnabled={!!auth.user.two_factor_confirmed_at}
                        className="max-w-xl"/>
                </div>

                <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                    <DropboxActivation
                        className="max-w-xl"/>
                </div>

                <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                    <DeleteUserForm className="max-w-xl"/>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
