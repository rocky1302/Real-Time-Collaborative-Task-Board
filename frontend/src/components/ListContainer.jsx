import React, { useState } from 'react';
import { CardItem } from './CardItem.jsx';

export const ListContainer = ({
    list,
    cards,
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
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const cardData = e.dataTransfer.getData('application/json');
        if (cardData) {
            const card = JSON.parse(cardData);
            if (card.list_id !== list.id) {
                onMoveCard(card.id, list.id, cards.length);
            }
        }
    };

    return (
        <div className="kanban-list">
            <div className="list-header">
                <span>{list.title}</span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => onDeleteList(list.id)}>
                        🗑️
                    </button>
                </div>
            </div>

            <div
                className={`list-cards ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {cards && cards.map((card) => (
                    <CardItem
                        key={card.id}
                        card={card}
                        onClick={onCardClick}
                        onDragStart={onDragStartCard}
                    />
                ))}

                {isAddingCard ? (
                    <form onSubmit={handleCreateCard} style={{ marginTop: '0.5rem' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter card title..."
                            value={newCardTitle}
                            onChange={(e) => setNewCardTitle(e.target.value)}
                            autoFocus
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button type="submit" className="btn btn-primary btn-sm">
                                Add Card
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
                        style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'flex-start' }}
                        onClick={() => setIsAddingCard(true)}
                    >
                        + Add a card
                    </button>
                )}
            </div>
        </div>
    );
};
