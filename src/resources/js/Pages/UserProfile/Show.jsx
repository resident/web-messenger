import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Head} from "@inertiajs/react";
import ProfileActions from "@/Pages/UserProfile/Partials/ProfileActions.jsx"

export default function Show({auth, user}) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header="Profile"
        >
            <Head title="Profile"/>

            <div className="p-3 max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                    <div className={`flex flex-col items-center`}>

                        {user.avatar && <img
                            src={`${import.meta.env.VITE_AVATARS_STORAGE}/${user.avatar.path}`}
                            alt={user.name}
                            className="size-40 rounded-full object-cover"
                        /> || <div className={`size-40 rounded-full bg-blue-300`}></div>}

                        <div className={`my-3 text-nowrap font-bold`}>{user.name}</div>

                        <ProfileActions isSelfProfile={auth.user.id === user.id} auth={auth} user={user}/>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
