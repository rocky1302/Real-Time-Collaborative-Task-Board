import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api.js';

export const CommentSection = ({ cardId, currentUserId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const res = await apiFetch(`/comments/card/${cardId}`);
            setComments(res.data);
        } catch (err) {
            console.error('Failed to load comments:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (cardId) {
            fetchComments();
        }
    }, [cardId]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const res = await apiFetch('/comments', {
                method: 'POST',
                body: JSON.stringify({ cardId, content: newComment.trim() }),
            });
            setComments([res.data, ...comments]);
            setNewComment('');
        } catch (err) {
            alert('Failed to post comment');
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await apiFetch(`/comments/${commentId}`, { method: 'DELETE' });
            setComments(comments.filter((c) => c.id !== commentId));
        } catch (err) {
            alert('Failed to delete comment');
        }
    };

    return (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>💬 Comments</h4>

            <form onSubmit={handleAddComment} style={{ marginBottom: '1rem' }}>
                <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>
                    Save Comment
                </button>
            </form>

            {loading ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading comments...</p>
            ) : comments.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No comments yet.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {comments.map((c) => (
                        <div
                            key={c.id}
                            style={{
                                backgroundColor: 'var(--bg-primary)',
                                padding: '0.65rem 0.85rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.85rem',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <strong style={{ color: 'var(--accent-primary)' }}>{c.username}</strong>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {new Date(c.created_at).toLocaleString()}
                                    </span>
                                    {c.user_id === currentUserId && (
                                        <button
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--danger)' }}
                                            onClick={() => handleDeleteComment(c.id)}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>{c.content}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
