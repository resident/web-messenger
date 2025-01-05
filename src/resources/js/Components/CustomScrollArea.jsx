import { useRef, useEffect, useState, useCallback } from "react";
import "../../css/CustomScrollArea.css";

export default function CustomScrollArea({
    children,
    className = "",
    className2 = "",
    classNameThumb = "bg-[#ccc] w-[6px]",
    style = {},
    handleScroll = null,
    externalContainerRef = null,
}) {
    const containerRef = externalContainerRef || useRef(null);
    const thumbRef = useRef(null);

    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [scrollStartTop, setScrollStartTop] = useState(0);

    const [isScrolling, setIsScrolling] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const scrollTimeoutRef = useRef(null);

    const frameRequestedRef = useRef(false);

    const resetScrollTimeout = useCallback(() => {
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        setIsScrolling(true);
        scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
        }, 500);
    }, []);

    const updateThumb = useCallback(() => {
        const container = containerRef.current;
        const thumb = thumbRef.current;
        frameRequestedRef.current = false;
        if (!container || !thumb) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const scrollableHeight = scrollHeight - clientHeight;

        if (scrollableHeight <= 0) {
            thumb.style.height = "0px";
            thumb.style.transform = "translateY(0px)";
            return;
        }

        const trackHeight = clientHeight;
        let thumbHeight = (clientHeight / scrollHeight) * trackHeight;
        if (thumbHeight < 20) {
            thumbHeight = 20;
        }

        const maxOffset = trackHeight - thumbHeight;
        const thumbOffset = (scrollTop / scrollableHeight) * maxOffset;

        thumb.style.height = `${thumbHeight}px`;
        thumb.style.transform = `translateY(${thumbOffset}px)`;
    }, []);

    const onScroll = useCallback(() => {
        if (handleScroll) {
            handleScroll();
        }
        if (!isDragging) {
            if (!frameRequestedRef.current) {
                frameRequestedRef.current = true;
                window.requestAnimationFrame(updateThumb);
            }
            //updateThumb();
        }
        resetScrollTimeout();
    }, [isDragging, updateThumb, handleScroll, resetScrollTimeout]);

    const onMouseDownThumb = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStartY(e.clientY);
        if (containerRef.current) {
            setScrollStartTop(containerRef.current.scrollTop);
        }
        thumbRef.current.classList.add("is-dragging");
    };

    const onMouseMove = useCallback(
        (e) => {
            if (!isDragging) return;

            const deltaY = e.clientY - dragStartY;
            const container = containerRef.current;
            const thumb = thumbRef.current;
            if (!container || !thumb) return;

            const { scrollHeight, clientHeight } = container;
            const scrollableHeight = scrollHeight - clientHeight;

            let trackHeight = clientHeight;
            let thumbHeight = parseFloat(thumb.style.height || "20");

            const maxThumbOffset = trackHeight - thumbHeight;
            const scrollRatio = scrollableHeight / maxThumbOffset;

            container.scrollTop = scrollStartTop + (deltaY * scrollRatio);

            updateThumb();
        },
        [isDragging, dragStartY, scrollStartTop, updateThumb]
    );

    const onMouseUp = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            thumbRef.current?.classList.remove("is-dragging");
        }
    }, [isDragging]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener("scroll", onScroll);
        window.addEventListener("resize", updateThumb);

        updateThumb();

        return () => {
            container.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", updateThumb);
        };
    }, [onScroll, updateThumb]);

    useEffect(() => {
        const handleMouseMove = (e) => onMouseMove(e);
        const handleMouseUp = () => onMouseUp();

        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        } else {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, onMouseMove, onMouseUp]);

    /*useEffect(() => {
        const handleMouseMove = () => resetScrollTimeout();
        const container = containerRef.current;

        if (container) {
            container.addEventListener("mousemove", handleMouseMove);
        }

        return () => {
            if (container) {
                container.removeEventListener("mousemove", handleMouseMove);
            }
        }
    }, [resetScrollTimeout]);*/

    useEffect(() => {
        const handleMouseEnter = () => setIsHovered(true);
        const handleMouseLeave = () => setIsHovered(false);

        const container = containerRef.current;

        if (container) {
            container.addEventListener("mouseenter", handleMouseEnter);
            container.addEventListener("mouseleave", handleMouseLeave);
        }

        return () => {
            if (container) {
                container.removeEventListener("mouseenter", handleMouseEnter);
                container.removeEventListener("mouseleave", handleMouseLeave);
            }
        };
    }, []);

    return (
        <div
            className={`custom-scroll-area overflow-y-auto ${isScrolling || isHovered ? "scrolling" : ""} ${className}`}
            style={{ ...style }}
            ref={containerRef}
        >
            <div className="custom-scroll-area-thumb-container">
                <div
                    className={`custom-scroll-area-thumb ${classNameThumb}`}
                    ref={thumbRef}
                    onMouseDown={onMouseDownThumb}
                />
            </div>

            <div className={`custom-scroll-area-content ${className2}`}>
                {children}
            </div>
        </div>
    );
}
