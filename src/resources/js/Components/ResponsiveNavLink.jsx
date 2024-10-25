import {Link} from '@inertiajs/react';

export default function ResponsiveNavLink({active = false, className = '', children, ...props}) {
    return (
        <Link
            {...props}
            className={`w-full flex items-start ps-3 pe-4 py-2 border-l-4 ${
                active
                    ? `
                        border-indigo-400 text-indigo-700 bg-indigo-50
                        focus:text-indigo-800 focus:bg-indigo-100 focus:border-indigo-700
                    `
                    : `
                        text-gray-600 border-gray-400
                        bg-gray-50
                        hover:text-blue-400 hover:border-blue-400
                        focus:text-blue-500 focus:bg-gray-50 focus:border-blue-500
                    `
            } text-base font-medium focus:outline-none transition duration-150 ease-in-out ${className}`}
        >
            {children}
        </Link>
    );
}
