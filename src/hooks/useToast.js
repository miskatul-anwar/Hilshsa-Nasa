import { useState, useCallback } from 'react';

let toastId = 0;

export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = toastId++;
        const newToast = { id, message, type, duration };

        setToasts((prev) => [...prev, newToast]);

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showSuccess = useCallback((message, duration) => {
        return addToast(message, 'success', duration);
    }, [addToast]);

    const showError = useCallback((message, duration) => {
        return addToast(message, 'error', duration);
    }, [addToast]);

    const showWarning = useCallback((message, duration) => {
        return addToast(message, 'warning', duration);
    }, [addToast]);

    const showLoading = useCallback((message) => {
        return addToast(message, 'loading', null);
    }, [addToast]);

    const showOnline = useCallback((message, duration) => {
        return addToast(message, 'online', duration);
    }, [addToast]);

    const showOffline = useCallback((message, duration) => {
        return addToast(message, 'offline', duration);
    }, [addToast]);

    return {
        toasts,
        addToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showLoading,
        showOnline,
        showOffline,
    };
};