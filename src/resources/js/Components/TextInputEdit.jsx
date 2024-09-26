import { forwardRef, useEffect, useRef, useState } from 'react';

export default forwardRef(function TextInputEdit({ type = 'text', className = '', isFocused = false, onChange, title = '', value, ...props }, ref) {
    const input = ref ? ref : useRef();
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [inputValue, setInputValue] = useState(value);

    useEffect(() => {
        if (isFocused) {
            input.current.focus();
        }
    }, [isFocused]);

    
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleInputChange = (e) => {
        setInputValue(e.target.value);  // Update local state
        if (onChange) {
            onChange(e);  // Trigger parent's onChange
        }
    };

    return (
        <div className="relative border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm p-3">
            {(isInputFocused || inputValue.length > 0) && (
                <span className="absolute -top-2 left-2 bg-white px-1 text-gray-600">{title}</span>
            )}
            <input
                type={type}
                className={"w-full border-none focus:ring-0 " + className}
                ref={input}
                value={inputValue}
                onChange={handleInputChange}
                placeholder={!isInputFocused && inputValue.length === 0 ? title : ''}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
            />
        </div>
    );
});
