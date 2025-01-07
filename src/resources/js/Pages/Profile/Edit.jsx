import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import DropboxActivation from './Partials/DropboxActivation';
import { Head } from '@inertiajs/react';
import TwoFactoAuthForm from "@/Pages/Profile/Partials/TwoFactoAuthForm.jsx";
import UploadDeleteAvatar from './Partials/UploadDeleteAvatar';
import OnlinePrivacyStatusForm from './Partials/OnlinePrivacyStatusForm';

export default function Edit({ auth, mustVerifyEmail, status, userSettings }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header="Profile"
        >
            <Head title="Profile" />

            <div className={`
                    p-1 max-w-7xl mx-auto space-y-6 bg-white text-white
                `}>
                <div className={`space-y-2 px-2 py-4 bg-white rounded-lg`}>
                    <div className="p-4 sm:p-8 bg-blue-500 shadow sm:rounded-lg">
                        <UploadDeleteAvatar className="max-w-xl" user={auth.user} />
                    </div>

                    <div className="p-4 sm:p-8 bg-blue-500 shadow sm:rounded-lg">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="p-4 sm:p-8 bg-blue-500 shadow sm:rounded-lg">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="p-4 sm:p-8 bg-blue-500 shadow sm:rounded-lg">
                        <TwoFactoAuthForm
                            isEnabled={!!auth.user.two_factor_confirmed_at}
                            className="max-w-xl" />
                    </div>

                    <div className="p-4 sm:p-8 bg-blue-500 shadow sm:rounded-lg">
                        <OnlinePrivacyStatusForm
                            className="max-w-xl"
                            userSettings={userSettings}
                        />
                    </div>

                    <div className="p-4 sm:p-8 bg-blue-500 shadow sm:rounded-lg">
                        <DropboxActivation
                            className="max-w-xl" />
                    </div>

                    <div className="p-4 sm:p-8 bg-blue-500 shadow sm:rounded-lg">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
