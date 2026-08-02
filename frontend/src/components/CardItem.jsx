import React from 'react';
import { LabelBadge } from './LabelBadge.jsx';

export const CardItem = ({ card, onClick, onDragStart }) => {
    const isOverdue = card.due_date && !card.completed_at && new Date(card.due_date) < new Date();
    const isCompleted = !!card.completed_at;

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div
            className={`card-item ${card.is_archived ? 'archived' : ''}`}
            draggable
            onDragStart={(e) => onDragStart(e, card)}
            onClick={() => onClick(card)}
        >
            {card.labels && card.labels.length > 0 && (
                <div className="card-labels">
                    {card.labels.map((label) => (
                        <LabelBadge key={label.id} name={label.name} color={label.color} />
                    ))}
                </div>
            )}

            <div className="card-title">{card.title}</div>

            <div className="card-footer">
                <div className="card-badges">
                    {card.due_date && (
                        <div className={`due-badge ${isCompleted ? 'completed' : isOverdue ? 'overdue' : ''}`}>
                            <span>🕒</span>
                            <span>{formatDate(card.due_date)}</span>
                        </div>
                    )}
                    {card.description && <span title="Has description">📄</span>}
                    {card.comment_count > 0 && (
                        <span title="Comments" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            💬 {card.comment_count}
                        </span>
                    )}
                </div>
                {isCompleted && <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>}
            </div>
        </div>
    );
};
