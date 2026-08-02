import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api.js';
import { BoardCard } from '../components/BoardCard.jsx';
import { EmptyState } from '../components/EmptyState.jsx';

export const DashboardPage = ({ onSelectBoard }) => {
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');

    const fetchBoards = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/boards');
            setBoards(res.data);
        } catch (err) {
            console.error('Failed to load boards:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoards();
    }, []);

    const handleCreateBoard = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        try {
            const res = await apiFetch('/boards', {
                method: 'POST',
                body: JSON.stringify({ title: newTitle.trim(), description: newDescription.trim() }),
            });
            setBoards([res.data, ...boards]);
            setNewTitle('');
            setNewDescription('');
            setIsCreating(false);
            onSelectBoard(res.data.id);
        } catch (err) {
            alert(err.message || 'Failed to create board');
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Your Workspace Boards</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Collaborate on real-time task management boards
                    </p>
                </div>

                <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
                    + Create New Board
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Loading boards...</div>
            ) : boards.length === 0 ? (
                <EmptyState
                    title="No boards found"
                    description="Create your first board to get started with lists and cards."
                    actionText="+ Create Board"
                    onAction={() => setIsCreating(true)}
                />
            ) : (
                <div className="boards-grid">
                    {boards.map((board) => (
                        <BoardCard key={board.id} board={board} onClick={onSelectBoard} />
                    ))}
                </div>
            )}

            {isCreating && (
                <div className="modal-overlay" onClick={() => setIsCreating(false)}>
                    <div className="modal-content" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Create Board</h3>
                        <form onSubmit={handleCreateBoard}>
                            <div className="form-group">
                                <label className="form-label">Board Title</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Product Launch Backlog"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description (Optional)</label>
                                <textarea
                                    className="form-textarea"
                                    rows="3"
                                    placeholder="Brief project details..."
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create Board
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
