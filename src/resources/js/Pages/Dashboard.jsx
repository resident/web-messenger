import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import Edit from './Profile/Edit';

export default function Dashboard({ auth }) {
    return (
        <AuthenticatedLayout user={auth.user} >
            <div className="py-1">
                <div className="max-w-7xl mx-auto sm:px-4 lg:px-2 space-y-6 grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 h-screen">
                
                    <Edit auth={auth}/>
                
                    <div className="w-full grid grid-cols-subgrid gap-4 sm:col-span-1 md:col-span-1 lg:col-span-2 p-6 bg-white rounded-lg shadow-lg">
                            {/* This column remains empty */}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
