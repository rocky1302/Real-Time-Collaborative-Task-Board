import React, { useContext } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { ThemeContext } from '../context/ThemeContext.jsx';

export const Header = ({ onBack, currentBoardTitle }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useContext(ThemeContext);

    return (
        <header className="navbar">
            <div className="logo" onClick={onBack}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <line x1="15" y1="3" x2="15" y2="21" />
                </svg>
                <span>Kanban Flow</span>
                {currentBoardTitle && <span style={{ opacity: 0.6, fontSize: '0.9rem', fontWeight: 500 }}>/ {currentBoardTitle}</span>}
            </div>

            <div className="nav-actions">
                <button className="btn btn-secondary btn-icon" onClick={toggleTheme} title="Toggle Dark/Light Mode">
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>

                {user && (
                    <>
                        <div className="user-badge">
                            <div className="avatar">{user.username.charAt(0).toUpperCase()}</div>
                            <span>{user.username}</span>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={logout}>
                            Logout
                        </button>
                    </>
                )}
            </div>
        </header>
    );
};
