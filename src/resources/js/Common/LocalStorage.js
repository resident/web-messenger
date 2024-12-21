import { useState } from 'react';

/**
 *
 * @param {string} storageKey
 * @returns {object}
 */
export default function useStorage(storageKey) {
    const [storedData, setStoredData] = useState(() => {
        try {
            const item = window.localStorage.getItem(storageKey);
            return item ? JSON.parse(item) : {};
        } catch (error) {
            console.error(`Error reading localStorage key "${storageKey}":`, error);
            return {};
        }
    });

    /**
     *
     * @param {object} newData
     */
    const setStoredDataAndPersist = (newData) => {
        try {
            setStoredData(newData);
            window.localStorage.setItem(storageKey, JSON.stringify(newData));
        } catch (error) {
            console.error(`Error setting localStorage key "${storageKey}":`, error);
        }
    };

    /**
     *
     * @param {string} chatRoomId
     * @returns {object|null}
     */
    const getChatState = (chatRoomId) => {
        return storedData[chatRoomId] || null;
    };

    /**
     *
     * @param {string} chatRoomId
     * @param {object} chatState
     */
    const setChatState = (chatRoomId, chatState) => {
        const updatedData = {
            ...storedData,
            [chatRoomId]: {
                ...chatState,
                timestamp: Date.now()
            },
        };
        setStoredDataAndPersist(updatedData);
    };

    /**
     *
     * @param {string} chatRoomId
     */
    const removeChatState = (chatRoomId) => {
        const { [chatRoomId]: _, ...rest } = storedData;
        setStoredDataAndPersist(rest);
    };

    const clearAll = () => {
        setStoredDataAndPersist({});
    };

    return {
        getChatState,
        setChatState,
        removeChatState,
        clearAll,
    };
};