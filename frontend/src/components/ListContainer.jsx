import React, { useState } from 'react';
import { CardItem } from './CardItem.jsx';

export const ListContainer = ({
    list,
    cards = [],
    onCardClick,
    onAddCard,
    onMoveCard,
    onUpdateList,
    onDeleteList,
    onDragStartCard,
}) => {
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [newCardTitle, setNewCardTitle] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);

    const handleCreateCard = (e) => {
        e.preventDefault();
        if (!newCardTitle.trim()) return;
        onAddCard(list.id, newCardTitle.trim());
        setNewCardTitle('');
        setIsAddingCard(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e, targetIndex = null) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const cardData = e.dataTransfer.getData('application/json');
        if (!cardData) return;

        try {
            const card = JSON.parse(cardData);
            const newPos = targetIndex !== null ? targetIndex : cards.length;
            onMoveCard(card.id, list.id, newPos);
        } catch (err) {
            console.error('Failed to parse dropped card data:', err);
        }
    };

    return (
        <div className="kanban-list">
            <div className="list-header">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span>{list.title}</span>
                    <span className="count-badge">{cards ? cards.length : 0}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '0.15rem 0.4rem', border: 'none' }} title="Options">
                        •••
                    </button>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '0.15rem 0.4rem', border: 'none' }} onClick={() => onDeleteList(list.id)} title="Delete List">
                        🗑️
                    </button>
                </div>
            </div>

            <div
                className={`list-cards ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, null)}
            >
                {cards && cards.map((card, index) => (
                    <CardItem
                        key={card.id}
                        card={card}
                        index={index}
                        onClick={onCardClick}
                        onDragStart={onDragStartCard}
                        onDragOverCard={(e) => e.preventDefault()}
                        onDropOnCard={(e, idx) => handleDrop(e, idx)}
                    />
                ))}

                {isAddingCard ? (
                    <form onSubmit={handleCreateCard} style={{ marginTop: '0.5rem' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter task title..."
                            value={newCardTitle}
                            onChange={(e) => setNewCardTitle(e.target.value)}
                            autoFocus
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button type="submit" className="btn btn-primary btn-sm">
                                Add Task
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setIsAddingCard(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center', backgroundColor: 'transparent', border: 'none', color: 'var(--text-secondary)' }}
                        onClick={() => setIsAddingCard(true)}
                    >
                        + Add Task
                    </button>
                )}
            </div>
        </div>
    );
};

