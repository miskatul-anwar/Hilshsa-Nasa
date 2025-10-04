import React, { useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Wifi, WifiOff, Loader } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
    useEffect(() => {
        if (duration && onClose) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="text-green-600" size={20} strokeWidth={2.5} />;
            case 'error':
                return <XCircle className="text-red-600" size={20} strokeWidth={2.5} />;
            case 'warning':
                return <AlertCircle className="text-orange-600" size={20} strokeWidth={2.5} />;
            case 'loading':
                return (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                );
            case 'online':
                return <Wifi className="text-green-600" size={20} strokeWidth={2.5} />;
            case 'offline':
                return <WifiOff className="text-red-600" size={20} strokeWidth={2.5} />;
            default:
                return <AlertCircle className="text-blue-600" size={20} strokeWidth={2.5} />;
        }
    };

    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'warning':
                return 'bg-orange-50 border-orange-200';
            case 'loading':
                return 'bg-blue-50 border-blue-200';
            case 'online':
                return 'bg-green-50 border-green-200';
            case 'offline':
                return 'bg-red-50 border-red-200';
            default:
                return 'bg-blue-50 border-blue-200';
        }
    };

    const getTextColor = () => {
        switch (type) {
            case 'success':
                return 'text-green-900';
            case 'error':
                return 'text-red-900';
            case 'warning':
                return 'text-orange-900';
            case 'loading':
                return 'text-blue-900';
            case 'online':
                return 'text-green-900';
            case 'offline':
                return 'text-red-900';
            default:
                return 'text-blue-900';
        }
    };

    return (
        <div
            className={`flex items - center gap - 3 ${getBackgroundColor()} border rounded - lg shadow - lg animate - slide -in -right min - w - [280px] max - w - [420px]`}
            style={{
                padding: 'clamp(12px, 2vw, 16px)',
            }}
        >
            <div className="flex-shrink-0">{getIcon()}</div>
            <p
                className={`flex - 1 font - medium ${getTextColor()} `}
                style={{ fontSize: 'clamp(13px, 2.5vw, 14px)', lineHeight: '1.4' }}
            >
                {message}
            </p>
            {onClose && type !== 'loading' && (
                <button
                    onClick={onClose}
                    className="flex-shrink-0 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Close notification"
                >
                    <X size={18} strokeWidth={2} />
                </button>
            )}
        </div>
    );
};

export default Toast;