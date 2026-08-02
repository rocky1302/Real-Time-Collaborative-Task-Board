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
    
    // View and Filter State
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterRole, setFilterRole] = useState('all'); // 'all', 'owner', 'member'
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'title'

    const fetchBoards = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/boards');
            setBoards(res.data || []);
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

    // Filter and Sort Boards
    const filteredBoards = boards
        .filter((board) => {
            const matchesSearch =
                !searchTerm.trim() ||
                board.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (board.description && board.description.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesRole =
                filterRole === 'all'
                    ? true
                    : filterRole === 'owner'
                    ? board.role === 'owner'
                    : board.role !== 'owner';

            return matchesSearch && matchesRole;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            if (sortBy === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
            if (sortBy === 'title') return a.title.localeCompare(b.title);
            return 0;
        });

    return (
        <div className="dashboard-container">
            {/* Top Welcome Heading */}
            <div className="dashboard-welcome">
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Trello Clone</h1>
                <p>Here's what's happening with your boards today.</p>
            </div>

            {/* Stat Overview Cards Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Total Boards</span>
                        <span className="stat-value">{boards.length}</span>
                    </div>
                    <div className="stat-icon-wrapper blue">📋</div>
                </div>

                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Active Projects</span>
                        <span className="stat-value">{boards.length}</span>
                    </div>
                    <div className="stat-icon-wrapper green">🚀</div>
                </div>

                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Recent Activity</span>
                        <span className="stat-value">2</span>
                    </div>
                    <div className="stat-icon-wrapper purple">📊</div>
                </div>

                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Total Workspace</span>
                        <span className="stat-value">{boards.length}</span>
                    </div>
                    <div className="stat-icon-wrapper indigo">💼</div>
                </div>
            </div>

            {/* Your Boards Section Header */}
            <div className="section-header-bar">
                <div className="section-title-group">
                    <h2>Your Boards</h2>
                    <p>Manage your projects and tasks</p>
                </div>

                <div className="dashboard-toolbar">
                    {/* View Switcher Toggle */}
                    <div className="view-toggle">
                        <button
                            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title="Grid View"
                        >
                            ⸬
                        </button>
                        <button
                            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title="List View"
                        >
                            ☰
                        </button>
                    </div>

                    {/* Filter Button */}
                    <button
                        className={`btn ${isFilterOpen ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                    >
                        🔍 Filter
                    </button>

                    {/* Create Board Button */}
                    <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
                        + Create Board
                    </button>
                </div>
            </div>

            {/* Interactive Filter Panel */}
            {isFilterOpen && (
                <div
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem 1.25rem',
                        marginBottom: '1.25rem',
                        display: 'flex',
                        gap: '1.5rem',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Filter Role:
                        </span>
                        <select
                            className="form-select"
                            style={{ width: 'auto', padding: '0.35rem 0.75rem' }}
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                        >
                            <option value="all">All Boards</option>
                            <option value="owner">Created by me</option>
                            <option value="member">Shared with me</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Sort By:
                        </span>
                        <select
                            className="form-select"
                            style={{ width: 'auto', padding: '0.35rem 0.75rem' }}
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="title">Title (A-Z)</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Search Input Bar */}
            <div className="search-bar-row">
                <input
                    type="text"
                    className="search-input-field"
                    placeholder="🔍 Search boards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Boards Grid / List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Loading boards...</div>
            ) : filteredBoards.length === 0 && searchTerm ? (
                <EmptyState
                    title="No matching boards found"
                    description={`No boards match your search query "${searchTerm}".`}
                    actionText="Clear Search"
                    onAction={() => setSearchTerm('')}
                />
            ) : (
                <div className={viewMode === 'grid' ? 'boards-grid' : 'boards-list-view'}>
                    {filteredBoards.map((board) => (
                        <BoardCard key={board.id} board={board} onClick={onSelectBoard} />
                    ))}

                    {/* Interactive "+ Create new board" dashed card */}
                    <div className="create-board-card" onClick={() => setIsCreating(true)}>
                        <span className="create-icon-plus">+</span>
                        <span>Create new board</span>
                    </div>
                </div>
            )}

            {/* Create Board Modal */}
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
                                    placeholder="e.g. Trello App Sprint"
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

