import React from 'react';

export const EmptyState = ({ title, description, actionText, onAction }) => {
    return (
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{title}</h3>
            <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>{description}</p>
            {actionText && onAction && (
                <button className="btn btn-primary" onClick={onAction}>
                    {actionText}
                </button>
            )}
        </div>
    );
};
