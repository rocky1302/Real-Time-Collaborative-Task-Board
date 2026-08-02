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
            if (onSetBoardTitle && res.data) {
                onSetBoardTitle(res.data.title);
            }
        } catch (err) {
            console.error('Failed to load board:', err);
        } finally {
            setLoading(false);
        }
    }, [boardId]);

    useEffect(() => {
        fetchBoardDetails();
    }, [boardId]);

    // Socket.io Real-Time Synchronization
    useEffect(() => {
        if (!socket || !boardId || !user) return;

        // Join board room
        socket.emit('board:join', { boardId, user });

        const handleSocketReload = () => {
            apiFetch(`/boards/${boardId}`)
                .then((res) => setBoard(res.data))
                .catch((err) => console.error(err));
        };

        socket.on('card:created', handleSocketReload);
        socket.on('card:moved', handleSocketReload);
        socket.on('card:updated', handleSocketReload);
        socket.on('card:deleted', handleSocketReload);
        socket.on('list:updated', handleSocketReload);

        return () => {
            socket.emit('board:leave', { boardId });
            socket.off('card:created', handleSocketReload);
            socket.off('card:moved', handleSocketReload);
            socket.off('card:updated', handleSocketReload);
            socket.off('card:deleted', handleSocketReload);
            socket.off('list:updated', handleSocketReload);
        };
    }, [socket, boardId, user]);

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
        // Optimistically update board state
        setBoard((prevBoard) => {
            if (!prevBoard) return prevBoard;

            let movedCard = null;
            const updatedLists = prevBoard.lists.map((list) => {
                const remainingCards = list.cards.filter((c) => {
                    if (c.id === cardId) {
                        movedCard = { ...c, list_id: targetListId };
                        return false;
                    }
                    return true;
                });
                return { ...list, cards: remainingCards };
            });

            if (!movedCard) return prevBoard;

            const finalLists = updatedLists.map((list) => {
                if (list.id === targetListId) {
                    const newCards = [...list.cards];
                    const pos = Math.min(Math.max(0, newPosition), newCards.length);
                    newCards.splice(pos, 0, movedCard);
                    return { ...list, cards: newCards };
                }
                return list;
            });

            return { ...prevBoard, lists: finalLists };
        });

        try {
            const res = await apiFetch(`/cards/${cardId}/move`, {
                method: 'PUT',
                body: JSON.stringify({ targetListId, newPosition }),
            });

            if (socket) {
                socket.emit('card:move', { boardId, cardId, targetListId, newPosition, card: res.data });
            }
        } catch (err) {
            console.error('Failed to persist move:', err);
            fetchBoardDetails();
        }
    };

    const handleUpdateCard = async (cardId, updates) => {
        try {
            const res = await apiFetch(`/cards/${cardId}`, {
                method: 'PUT',
                body: JSON.stringify(updates),
            });

            const updatedCard = res.data;
            setBoard((prev) => ({
                ...prev,
                lists: prev.lists.map((list) => ({
                    ...list,
                    cards: list.cards.map((c) => (c.id === cardId ? { ...c, ...updatedCard } : c)),
                })),
            }));
            setSelectedCard((prev) => (prev && prev.id === cardId ? { ...prev, ...updatedCard } : prev));

            if (socket) {
                socket.emit('card:update', { boardId, card: updatedCard });
            }
        } catch (err) {
            alert(err.message || 'Failed to update card');
        }
    };

    const handleArchiveCard = async (cardId, shouldArchive) => {
        try {
            const endpoint = shouldArchive ? `/cards/${cardId}/archive` : `/cards/${cardId}/restore`;
            const res = await apiFetch(endpoint, { method: 'PUT' });
            const updatedCard = res.data;

            setBoard((prev) => ({
                ...prev,
                lists: prev.lists.map((list) => ({
                    ...list,
                    cards: list.cards.map((c) => (c.id === cardId ? { ...c, ...updatedCard } : c)),
                })),
            }));
            setSelectedCard(null);

            if (socket) {
                socket.emit('card:update', { boardId, card: updatedCard });
            }
        } catch (err) {
            alert(err.message || 'Failed to archive/restore card');
        }
    };

    const handleDeleteCardPermanently = async (cardId) => {
        if (!window.confirm('Permanently delete this card? This cannot be undone.')) return;
        try {
            await apiFetch(`/cards/${cardId}`, { method: 'DELETE' });

            setBoard((prev) => ({
                ...prev,
                lists: prev.lists.map((list) => ({
                    ...list,
                    cards: list.cards.filter((c) => c.id !== cardId),
                })),
            }));
            setSelectedCard(null);

            if (socket) {
                socket.emit('card:delete', { boardId, cardId });
            }
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
            setMemberEmail('');
            setMemberRole('editor');
            setIsAddMemberOpen(false);
            fetchBoardDetails();
        } catch (err) {
            alert(err.message || 'Failed to add member');
        }
    };

    const handleDragStartCard = (e, card) => {
        window.__draggedCard = card;
        try {
            e.dataTransfer.setData('application/json', JSON.stringify(card));
            e.dataTransfer.setData('text/plain', JSON.stringify(card));
            e.dataTransfer.effectAllowed = 'move';
        } catch (err) {
            console.error('DragStart setData error:', err);
        }
    };

    const totalTasks = board && board.lists ? board.lists.reduce((acc, list) => {
        return acc + (list.cards ? list.cards.filter((c) => !c.is_archived).length : 0);
    }, 0) : 0;

    return (
        <div className="board-page">
            <div className="board-bar">
                <div className="board-title-group">
                    <button className="btn btn-secondary btn-sm" onClick={onBack}>
                        ← Back to dashboard
                    </button>
                    {board && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>📋</span>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{board.title}</h2>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer' }}>•••</span>
                            </div>
                            <span className="count-badge" style={{ fontSize: '0.82rem', padding: '0.25rem 0.65rem' }}>
                                Total Tasks: {totalTasks}
                            </span>
                        </>
                    )}
                </div>

                {board && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                            type="text"
                            className="form-input"
                            style={{ width: '180px', padding: '0.4rem 0.75rem' }}
                            placeholder="🔍 Search tasks..."
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

                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                                if (board.lists.length > 0) {
                                    const firstList = board.lists[0];
                                    const taskTitle = prompt('Enter new task title for ' + firstList.title + ':');
                                    if (taskTitle && taskTitle.trim()) {
                                        handleAddCard(firstList.id, taskTitle.trim());
                                    }
                                }
                            }}
                        >
                            + Add Task
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Loading board workspace...</div>
                    <div style={{ fontSize: '0.9rem' }}>Fetching lists and tasks...</div>
                </div>
            ) : !board ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                        Unable to load board workspace.
                    </h3>
                    <button className="btn btn-primary" onClick={onBack}>
                        ← Return to Dashboard
                    </button>
                </div>
            ) : (
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
            )}

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
