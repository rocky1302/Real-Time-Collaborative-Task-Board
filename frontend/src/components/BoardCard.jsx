import React from 'react';

export const BoardCard = ({ board, onClick }) => {
    const colorClasses = ['blue', 'pink', 'teal', 'purple'];
    const colorClass = colorClasses[(board.id || 0) % colorClasses.length];

    const formatDate = (dateStr) => {
        if (!dateStr) return '7/19/2025';
        const d = new Date(dateStr);
        return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    };

    return (
        <div className="board-card" onClick={() => onClick(board.id)}>
            <div>
                <div className="board-card-top-bar">
                    <span className={`color-dot ${colorClass}`}></span>
                    <span className="badge-new">New</span>
                </div>
                <div className="board-card-title">{board.title}</div>
                {board.description && (
                    <div className="board-card-desc" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {board.description}
                    </div>
                )}
            </div>

            <div>
                <div className="board-card-dates">
                    <span>Created {formatDate(board.created_at)}</span>
                    <span>Updated {formatDate(board.updated_at || board.created_at)}</span>
                </div>
                <div className="board-card-meta" style={{ marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)' }}>
                    <span>Role: <strong>{board.role || 'Member'}</strong></span>
                    <span>👤 {board.owner_username || 'Owner'}</span>
                </div>
            </div>
        </div>
    );
};

