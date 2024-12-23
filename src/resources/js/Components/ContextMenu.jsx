import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

export default function ContextMenu({ options, position, onClose }) {
    const menuRef = useRef(null);
    const [adjustedPosition, setAdjustedPosition] = useState({ x: position.x, y: position.y });
    const [isVisible, setIsVisible] = useState(false);
    const [hasMeasured, setHasMeasured] = useState(false);
    const animationDuration = 150;

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                handleClose();
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    useLayoutEffect(() => {
        if (menuRef.current) {
            const menuRect = menuRef.current.getBoundingClientRect();
            const { innerWidth, innerHeight } = window;

            let newX = position.x;
            let newY = position.y;

            if (position.x + menuRect.width > innerWidth) {
                newX = position.x - menuRect.width;
                if (newX < 0) {
                    newX = 0;
                }
            }

            if (position.y + menuRect.height > innerHeight) {
                newY = position.y - menuRect.height;
                if (newY < 0) {
                    newY = 0;
                }
            }

            setAdjustedPosition({ x: newX, y: newY });
            setHasMeasured(true);
        }
    }, [position]);

    useEffect(() => {
        if (hasMeasured) {
            setTimeout(() => {
                setIsVisible(true);
            }, 0);
        }
    }, [hasMeasured]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, animationDuration);
    };

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleWheel = (e) => {
            e.preventDefault();
        };

        const handleTouchMove = (e) => {
            handleClose();
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (menuRef.current) {
                const menuRect = menuRef.current.getBoundingClientRect();
                const margin = 50;

                const extendedRect = {
                    top: menuRect.top - margin,
                    right: menuRect.right + margin,
                    bottom: menuRect.bottom + margin,
                    left: menuRect.left - margin,
                };

                const { clientX, clientY } = e;

                const isInside =
                    clientX >= extendedRect.left &&
                    clientX <= extendedRect.right &&
                    clientY >= extendedRect.top &&
                    clientY <= extendedRect.bottom;

                if (!isInside) {
                    handleClose();
                }
            }
        };

        document.addEventListener('mousemove', handleMouseMove);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return ReactDOM.createPortal(
        <div
            ref={menuRef}
            className={`fixed bg-gray-100 rounded-lg p-2 space-y-2 z-50 transform transition-all duration-150 ease-out
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
      `}
            style={{
                top: adjustedPosition.y,
                left: adjustedPosition.x,
                visibility: hasMeasured ? 'visible' : 'hidden',
                transformOrigin: 'top left',
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {options.map((option, index) => (
                <div
                    key={index}
                    onClick={option.onClick}
                    className={
                        `flex items-center rounded-md pl-3 py-2 pr-7 cursor-pointer hover:bg-gray-200
                        ${option.color || 'text-black'} text-sm`
                    }
                >
                    {option.icon}
                    <span className="ml-4">{option.label}</span>
                </div>
            ))}
        </div>,
        document.body
    );
}
