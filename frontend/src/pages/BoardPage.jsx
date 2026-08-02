import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api.js';
import { useSocket } from '../hooks/useSocket.js';
import { useAuth } from '../hooks/useAuth.js';
import { ListContainer } from '../components/ListContainer.jsx';
import { CardModal } from '../components/CardModal.jsx';
import { ActivityLogModal } from '../components/ActivityLogModal.jsx';

export const BoardPage = ({ boardId, onBack, onSetBoardTitle }) => {
    const { socket } = useSocket();
    const { user } = useAuth();

    const [board, setBoard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCard, setSelectedCard] = useState(null);
    const [isActivityOpen, setIsActivityOpen] = useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [memberEmail, setMemberEmail] = useState('');
    const [memberRole, setMemberRole] = useState('editor');
    const [showArchived, setShowArchived] = useState(false);

    const [newListTitle, setNewListTitle] = useState('');
    const [isAddingList, setIsAddingList] = useState(false);

    const fetchBoardDetails = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiFetch(`/boards/${boardId}`);
            setBoard(res.data);
            if (onSetBoardTitle) onSetBoardTitle(res.data.title);
        } catch (err) {
            console.error('Failed to load board:', err);
            onBack();
        } finally {
            setLoading(false);
        }
    }, [boardId, onBack, onSetBoardTitle]);

    useEffect(() => {
        fetchBoardDetails();
    }, [fetchBoardDetails]);

    // Socket.io Real-Time Synchronization
    useEffect(() => {
        if (!socket || !boardId || !user) return;

        // Join board room
        socket.emit('board:join', { boardId, user });

        socket.on('card:created', (newCard) => {
            fetchBoardDetails();
        });

        socket.on('card:moved', () => {
            fetchBoardDetails();
        });

        socket.on('card:updated', () => {
            fetchBoardDetails();
        });

        socket.on('card:deleted', () => {
            fetchBoardDetails();
        });

        socket.on('list:updated', () => {
            fetchBoardDetails();
        });

        return () => {
            socket.emit('board:leave', { boardId });
            socket.off('card:created');
            socket.off('card:moved');
            socket.off('card:updated');
            socket.off('card:deleted');
            socket.off('list:updated');
        };
    }, [socket, boardId, user, fetchBoardDetails]);

    const handleAddList = async (e) => {
        e.preventDefault();
        if (!newListTitle.trim()) return;

        try {
            const res = await apiFetch('/lists', {
                method: 'POST',
                body: JSON.stringify({ boardId, title: newListTitle.trim() }),
            });

            if (socket) {
                socket.emit('list:update', { boardId, listData: res.data, action: 'created' });
            }

            setBoard((prev) => ({
                ...prev,
                lists: [...prev.lists, { ...res.data, cards: [] }],
            }));

            setNewListTitle('');
            setIsAddingList(false);
        } catch (err) {
            alert(err.message || 'Failed to add list');
        }
    };

    const handleDeleteList = async (listId) => {
        if (!window.confirm('Delete this list and all its cards?')) return;
        try {
            await apiFetch(`/lists/${listId}`, { method: 'DELETE' });
            setBoard((prev) => ({
                ...prev,
                lists: prev.lists.filter((l) => l.id !== listId),
            }));
            if (socket) {
                socket.emit('list:update', { boardId, listData: { id: listId }, action: 'deleted' });
            }
        } catch (err) {
            alert(err.message || 'Failed to delete list');
        }
    };

    const handleAddCard = async (listId, title) => {
        try {
            const res = await apiFetch('/cards', {
                method: 'POST',
                body: JSON.stringify({ listId, title }),
            });

            const newCard = res.data;
            setBoard((prev) => ({
                ...prev,
                lists: prev.lists.map((list) =>
                    list.id === listId ? { ...list, cards: [...list.cards, newCard] } : list
                ),
            }));

            if (socket) {
                socket.emit('card:create', { boardId, card: newCard });
            }
        } catch (err) {
            alert(err.message || 'Failed to add card');
        }
    };

    const handleMoveCard = async (cardId, targetListId, newPosition) => {
        try {
            const res = await apiFetch(`/cards/${cardId}/move`, {
                method: 'PUT',
                body: JSON.stringify({ targetListId, newPosition }),
            });

            fetchBoardDetails();

            if (socket) {
                socket.emit('card:move', { boardId, cardId, targetListId, newPosition, card: res.data });
            }
        } catch (err) {
            alert(err.message || 'Failed to move card');
        }
    };

    const handleUpdateCard = async (cardId, updates) => {
        try {
            const res = await apiFetch(`/cards/${cardId}`, {
                method: 'PUT',
                body: JSON.stringify(updates),
            });

            fetchBoardDetails();

            if (socket) {
                socket.emit('card:update', { boardId, card: res.data });
            }

            if (selectedCard && selectedCard.id === cardId) {
                setSelectedCard(res.data);
            }
        } catch (err) {
            alert(err.message || 'Failed to update card');
        }
    };

    const handleArchiveCard = async (cardId, shouldArchive) => {
        try {
            const endpoint = shouldArchive ? `/cards/${cardId}/archive` : `/cards/${cardId}/restore`;
            const res = await apiFetch(endpoint, { method: 'PUT' });

            fetchBoardDetails();

            if (socket) {
                socket.emit('card:update', { boardId, card: res.data });
            }

            if (selectedCard) setSelectedCard(null);
        } catch (err) {
            alert(err.message || 'Failed to update card archive status');
        }
    };

    const handleDeleteCardPermanently = async (cardId) => {
        if (!window.confirm('Permanently delete this card?')) return;
        try {
            await apiFetch(`/cards/${cardId}`, { method: 'DELETE' });

            fetchBoardDetails();

            if (socket) {
                socket.emit('card:delete', { boardId, cardId });
            }

            if (selectedCard) setSelectedCard(null);
        } catch (err) {
            alert(err.message || 'Failed to delete card');
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!memberEmail.trim()) return;

        try {
            await apiFetch(`/boards/${boardId}/members`, {
                method: 'POST',
                body: JSON.stringify({ email: memberEmail.trim(), role: memberRole }),
            });
            alert('Member added successfully!');
            setMemberEmail('');
            setIsAddMemberOpen(false);
            fetchBoardDetails();
        } catch (err) {
            alert(err.message || 'Failed to add member');
        }
    };

    const handleDragStartCard = (e, card) => {
        e.dataTransfer.setData('application/json', JSON.stringify(card));
    };

    if (loading || !board) {
        return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading board workspace...</div>;
    }

    return (
        <div className="board-page">
            <div className="board-bar">
                <div className="board-title-group">
                    <button className="btn btn-secondary btn-sm" onClick={onBack}>
                        ← Back to Boards
                    </button>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{board.title}</h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                        type="text"
                        className="form-input"
                        style={{ width: '200px', padding: '0.4rem 0.75rem' }}
                        placeholder="🔍 Search cards..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <button
                        className={`btn btn-sm ${showArchived ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setShowArchived(!showArchived)}
                    >
                        {showArchived ? 'Hide Archived' : 'Show Archived'}
                    </button>

                    <button className="btn btn-secondary btn-sm" onClick={() => setIsAddMemberOpen(true)}>
                        👥 Members ({board.members ? board.members.length : 1})
                    </button>

                    <button className="btn btn-secondary btn-sm" onClick={() => setIsActivityOpen(true)}>
                        📜 Activity
                    </button>
                </div>
            </div>

            <div className="kanban-canvas">
                {board.lists.map((list) => {
                    const filteredCards = list.cards.filter((card) => {
                        const matchesArchive = showArchived ? true : !card.is_archived;
                        const matchesSearch =
                            !searchTerm.trim() ||
                            card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (card.description && card.description.toLowerCase().includes(searchTerm.toLowerCase()));
                        return matchesArchive && matchesSearch;
                    });

                    return (
                        <ListContainer
                            key={list.id}
                            list={list}
                            cards={filteredCards}
                            onCardClick={(card) => setSelectedCard(card)}
                            onAddCard={handleAddCard}
                            onMoveCard={handleMoveCard}
                            onDeleteList={handleDeleteList}
                            onDragStartCard={handleDragStartCard}
                        />
                    );
                })}

                {isAddingList ? (
                    <form onSubmit={handleAddList} className="kanban-list" style={{ padding: '0.75rem' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter list title..."
                            value={newListTitle}
                            onChange={(e) => setNewListTitle(e.target.value)}
                            autoFocus
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button type="submit" className="btn btn-primary btn-sm">
                                Add List
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setIsAddingList(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                        className="btn btn-secondary"
                        style={{ minWidth: '260px', justifyContent: 'flex-start' }}
                        onClick={() => setIsAddingList(true)}
                    >
                        + Add another list
                    </button>
                )}
            </div>

            {selectedCard && (
                <CardModal
                    isOpen={!!selectedCard}
                    card={selectedCard}
                    currentUserId={user.id}
                    onClose={() => setSelectedCard(null)}
                    onUpdateCard={handleUpdateCard}
                    onArchiveCard={handleArchiveCard}
                    onDeleteCard={handleDeleteCardPermanently}
                />
            )}

            <ActivityLogModal
                isOpen={isActivityOpen}
                boardId={boardId}
                onClose={() => setIsActivityOpen(false)}
            />

            {isAddMemberOpen && (
                <div className="modal-overlay" onClick={() => setIsAddMemberOpen(false)}>
                    <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1rem' }}>Add Board Member</h3>
                        <form onSubmit={handleAddMember}>
                            <div className="form-group">
                                <label className="form-label">Member Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="user@example.com"
                                    value={memberEmail}
                                    onChange={(e) => setMemberEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select
                                    className="form-select"
                                    value={memberRole}
                                    onChange={(e) => setMemberRole(e.target.value)}
                                >
                                    <option value="editor">Editor (Can edit lists & cards)</option>
                                    <option value="viewer">Viewer (Read only)</option>
                                    <option value="owner">Owner (Full control)</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsAddMemberOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Add Member
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
