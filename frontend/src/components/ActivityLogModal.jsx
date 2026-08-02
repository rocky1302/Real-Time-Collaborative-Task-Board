import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api.js';

export const ActivityLogModal = ({ isOpen, boardId, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && boardId) {
            const fetchLogs = async () => {
                try {
                    setLoading(true);
                    const res = await apiFetch(`/boards/${boardId}/activity?limit=25`);
                    setLogs(res.data);
                } catch (err) {
                    console.error('Failed to load activity logs:', err);
                } finally {
                    setLoading(false);
                }
            };
            fetchLogs();
        }
    }, [isOpen, boardId]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.2rem' }}>📜 Board Activity History</h3>
                    <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
                </div>

                {loading ? (
                    <p style={{ color: 'var(--text-muted)' }}>Loading activity logs...</p>
                ) : logs.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No activities logged yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {logs.map((log) => (
                            <div key={log.id} className="activity-item">
                                <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{log.username}</div>
                                <div style={{ flex: 1 }}>
                                    <span>{log.action}</span>
                                    {log.card_title && <strong> "{log.card_title}"</strong>}
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                        {new Date(log.created_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
