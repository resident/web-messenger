import {forwardRef, useEffect, useRef} from 'react';

export default forwardRef(function FileInput({className = '', isFocused = false, ...props}, ref) {
    const input = ref ? ref : useRef();

    useEffect(() => {
        if (isFocused) {
            input.current.focus();
        }
    }, []);

    return (
        <input
            {...props}
            type="file"
            className={`
                block w-full text-sm text-gray-500 rounded-md outline outline-blue-50 hover:outline-blue-100
                bg-blue-50 cursor-pointer file:cursor-pointer
                file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                ${className}
            `}
            ref={input}
        />
    );
});
