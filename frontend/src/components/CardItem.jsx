import React, { useState } from 'react';
import { LabelBadge } from './LabelBadge.jsx';

export const CardItem = ({ card, index, onClick, onDragStart, onDragOverCard, onDropOnCard }) => {
    const [isDragging, setIsDragging] = useState(false);
    const isOverdue = card.due_date && !card.completed_at && new Date(card.due_date) < new Date();
    const isCompleted = !!card.completed_at;

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const dotColors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6'];
    const statusDotColor = dotColors[(card.id || 0) % dotColors.length];

    const handleDragStart = (e) => {
        setIsDragging(true);
        onDragStart(e, card, index);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    return (
        <div
            className={`card-item ${card.is_archived ? 'archived' : ''} ${isDragging ? 'dragging' : ''}`}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => {
                e.preventDefault();
                if (onDragOverCard) onDragOverCard(e, index);
            }}
            onDrop={(e) => onDropOnCard && onDropOnCard(e, index)}
            onClick={() => onClick(card)}
        >
            {card.labels && card.labels.length > 0 && (
                <div className="card-labels">
                    {card.labels.map((label) => (
                        <LabelBadge key={label.id} name={label.name} color={label.color} />
                    ))}
                </div>
            )}

            <div className="card-title" style={{ fontWeight: 700, fontSize: '0.95rem' }}>{card.title}</div>

            {card.description && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                    {card.description.length > 60 ? card.description.slice(0, 60) + '...' : card.description}
                </div>
            )}

            <div className="card-footer" style={{ marginTop: '0.4rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <span>👤 @{card.assignee_username || 'user'}</span>
                    {card.due_date && <span>📅 {formatDate(card.due_date)}</span>}
                </div>
                <span
                    style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: isCompleted ? 'var(--success)' : statusDotColor,
                        display: 'inline-block',
                    }}
                />
            </div>
        </div>
    );
};

