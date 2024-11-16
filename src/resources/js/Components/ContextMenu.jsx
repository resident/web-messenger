import React, { useEffect } from 'react';

export default function ContextMenu({ options, position, onClose }) {
    useEffect(() => {
        const handleClickOutside = () => {
            onClose();
        };
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div
            className="absolute bg-white rounded-xl overflow-hidden z-50"
            style={{
                top: position.y,
                left: position.x,
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {options.map((option, index) => (
                <div
                    key={index}
                    onClick={option.onClick}
                    className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 ${option.color || 'text-black'}`}
                >
                    {option.icon}
                    <span className="ml-2">{option.label}</span>
                </div>
            ))}
        </div>
    );
}
