import React, { useState, useEffect } from 'react';
import { CommentSection } from './CommentSection.jsx';
import { PREDEFINED_LABELS } from '../utils/constants.js';

export const CardModal = ({ isOpen, card, currentUserId, onClose, onUpdateCard, onArchiveCard, onDeleteCard }) => {
    if (!isOpen || !card) return null;

    const [title, setTitle] = useState(card.title || '');
    const [description, setDescription] = useState(card.description || '');
    const [dueDate, setDueDate] = useState(card.due_date ? card.due_date.slice(0, 10) : '');
    const [selectedLabels, setSelectedLabels] = useState(card.labels ? card.labels.map((l) => l.id) : []);

    useEffect(() => {
        if (card) {
            setTitle(card.title || '');
            setDescription(card.description || '');
            setDueDate(card.due_date ? card.due_date.slice(0, 10) : '');
            setSelectedLabels(card.labels ? card.labels.map((l) => l.id) : []);
        }
    }, [card]);

    const handleSave = (e) => {
        e.preventDefault();
        onUpdateCard(card.id, {
            title,
            description,
            dueDate: dueDate ? new Date(dueDate).toISOString() : null,
            labelIds: selectedLabels,
        });
    };

    const toggleLabel = (labelId) => {
        if (selectedLabels.includes(labelId)) {
            setSelectedLabels(selectedLabels.filter((id) => id !== labelId));
        } else {
            setSelectedLabels([...selectedLabels, labelId]);
        }
    };

    const toggleCompletion = () => {
        onUpdateCard(card.id, {
            isCompleted: !card.completed_at,
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: '1.2rem', fontWeight: 700, border: 'none', background: 'transparent' }}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    In list <strong>{card.list_title || 'List'}</strong>
                </div>

                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-textarea"
                            rows="3"
                            placeholder="Add a more detailed description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Labels</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {PREDEFINED_LABELS.map((label) => {
                                const isSelected = selectedLabels.includes(label.id);
                                return (
                                    <button
                                        type="button"
                                        key={label.id}
                                        className="btn btn-sm"
                                        style={{
                                            backgroundColor: label.color,
                                            color: 'white',
                                            opacity: isSelected ? 1 : 0.4,
                                            border: isSelected ? '2px solid white' : 'none',
                                        }}
                                        onClick={() => toggleLabel(label.id)}
                                    >
                                        {label.name} {isSelected ? '✓' : ''}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div style={{ flex: 1 }}>
                            <label className="form-label">Due Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>

                        <div style={{ paddingTop: '1.5rem' }}>
                            <button
                                type="button"
                                className={`btn ${card.completed_at ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={toggleCompletion}
                            >
                                {card.completed_at ? '✓ Completed' : 'Mark Complete'}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary">
                            Save Changes
                        </button>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => onArchiveCard(card.id, !card.is_archived)}
                            >
                                {card.is_archived ? 'Restore Card' : 'Archive Card'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => onDeleteCard(card.id)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </form>

                <CommentSection cardId={card.id} currentUserId={currentUserId} />
            </div>
        </div>
    );
};
