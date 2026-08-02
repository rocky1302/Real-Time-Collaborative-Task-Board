import React from 'react';

export const BoardCard = ({ board, onClick }) => {
    return (
        <div className="board-card" onClick={() => onClick(board.id)}>
            <div>
                <div className="board-card-title">{board.title}</div>
                <div className="board-card-desc">{board.description || 'No description provided.'}</div>
            </div>
            <div className="board-card-meta">
                <span>Role: <strong>{board.role || 'Member'}</strong></span>
                <span>Owner: {board.owner_username}</span>
            </div>
        </div>
    );
};
