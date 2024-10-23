import PrimaryButton from '@/Components/PrimaryButton';
import {Head, useForm} from '@inertiajs/react';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout.jsx";

export default function VerifyEmail({auth, status}) {
    const {post, processing} = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Email Verification</h2>}
        >
            <Head title="Email Verification"/>

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">

                        <div className="mb-4 text-sm text-gray-600">
                            Thanks for signing up! Before getting started, could you verify your email address by
                            clicking
                            on the
                            link we just emailed to you? If you didn't receive the email, we will gladly send you
                            another.
                        </div>

                        {status === 'verification-link-sent' && (
                            <div className="mb-4 font-medium text-sm text-green-600">
                                A new verification link has been sent to the email address you provided during
                                registration.
                            </div>
                        )}

                        <form onSubmit={submit}>
                            <div className="mt-4 flex items-center justify-between">
                                <PrimaryButton disabled={processing}>Resend Verification Email</PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
