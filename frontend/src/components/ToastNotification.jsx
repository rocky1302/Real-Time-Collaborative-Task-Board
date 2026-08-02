import React from 'react';

export const ToastNotification = ({ toasts, onRemove }) => {
    if (!toasts || toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <div key={toast.id} className={`toast toast-${toast.type}`} onClick={() => onRemove(toast.id)}>
                    <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}</span>
                    <span>{toast.message}</span>
                </div>
            ))}
        </div>
    );
};
