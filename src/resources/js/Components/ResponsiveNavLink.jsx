import {Link} from '@inertiajs/react';

export default function ResponsiveNavLink({active = false, className = '', children, ...props}) {
    return (
        <Link
            {...props}
            className={`w-full flex items-start ps-3 pe-4 py-2 border-l-4 text-white ${
                active
                    ? `
                        border-white bg-[#2889EE]
                        focus:text-indigo-800 focus:bg-indigo-100 focus:border-indigo-700
                    `
                    : `
                        border-blue-800
                        bg-[#0F59A6]
                        hover:text-blue-400 hover:border-blue-400
                        focus:text-blue-500 focus:bg-gray-50 focus:border-blue-500
                    `
            } text-base font-medium focus:outline-none transition duration-150 ease-in-out ${className}`}
        >
            {children}
        </Link>
    );
}
