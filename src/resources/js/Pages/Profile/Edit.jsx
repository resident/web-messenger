import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import DeleteUserForm from './Partials/DeleteUserForm';
import { Head, Link } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';
import { useState } from 'react';
import { ArrowUturnLeftIcon, EllipsisVerticalIcon, PencilIcon } from '@heroicons/react/24/solid';


export default function Edit({ auth, mustVerifyEmail, status }) {
    const [selectedPage, setSelectedPage] = useState(null);
    const handleMenuClick = (page) => {
        setSelectedPage(page);
    };

    return (
                    <div className="w-full bg-gray-100 p-4 rounded-lg shadow-lg">
                        
                        {selectedPage === null ? (
                            <div>
                                <div className="flex flex-row justify-between p-1">
                                    <ArrowUturnLeftIcon className='mt-1 w-6 h-6'></ArrowUturnLeftIcon>
                                    <h1>Settings</h1>
                                    <div className='flex flex-row space-x-2'>
                                        <button className="hover:bg-gray-200" onClick={() => handleMenuClick(<UpdateProfileInformationForm/>)} >
                                            <PencilIcon className="w-6 h-6" />
                                        </button>
                                        <Dropdown>
                                        <Dropdown.Trigger>
                                            <span className="inline-flex rounded-md">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none transition ease-in-out duration-150"
                                                >
                                                    <EllipsisVerticalIcon className='w-6 h-6'/>
                                                </button>
                                            </span>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content>
                                            <Dropdown.Link href={route('logout')} method="post" as="button">Log Out</Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                    </div>
                                    
                                </div>
                                
                                <div className="flex flex-col items-center space-y-6">
                                
                                <div className="relative w-full h-auto">
                                    <img 
                                        src="https://i.scdn.co/image/ab6761610000517456d2d8d16ddedbf61b1c74f0" 
                                        alt="User Avatar" 
                                        className="w-full h-auto object-cover rounded-lg"
                                    />
                                    <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50">
                                        <span className="text-white mx-2 font-medium">{auth.user.name}</span>
                                    </div>
                                </div>

                                
                                <div className="flex flex-col space-y-4 w-full max-w-sm">
                                    <button 
                                        onClick={() => handleMenuClick(<UpdateProfileInformationForm status={status}/>)} 
                                        className="text-lg font-medium text-gray-700 hover:text-indigo-500 transition-colors"
                                    >
                                        General Settings
                                    </button>
                                    <button 
                                        onClick={() => handleMenuClick('changePassword')} 
                                        className="text-lg font-medium text-gray-700 hover:text-indigo-500 transition-colors"
                                    >
                                        Change Password
                                    </button>
                                    <button 
                                        onClick={() => handleMenuClick('notificationSettings')} 
                                        className="text-lg font-medium text-gray-700 hover:text-indigo-500 transition-colors"
                                    >
                                        Notification Settings
                                    </button>
                                </div>
                            </div>
                            </div>
                            
                        ) : (
                            <div>
                                <ArrowUturnLeftIcon onClick={() => setSelectedPage(null)}className="mb-6 w-6 h-6 hover:underline">
                                    Back to Menu
                                </ArrowUturnLeftIcon>
                                {selectedPage}
                            </div>
                        )}
                    </div>
    );
}
