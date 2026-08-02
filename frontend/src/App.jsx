import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth.js';
import { Header } from './components/Header.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { BoardPage } from './pages/BoardPage.jsx';

export const App = () => {
    const { user, loading } = useAuth();
    const [view, setView] = useState('login'); // 'login', 'register', 'dashboard', 'board'
    const [selectedBoardId, setSelectedBoardId] = useState(null);
    const [boardTitle, setBoardTitle] = useState('');

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Loading Kanban Flow...</div>
            </div>
        );
    }

    if (!user) {
        return view === 'register' ? (
            <RegisterPage
                onNavigateLogin={() => setView('login')}
                onRegisterSuccess={() => setView('dashboard')}
            />
        ) : (
            <LoginPage
                onNavigateRegister={() => setView('register')}
                onLoginSuccess={() => setView('dashboard')}
            />
        );
    }

    const handleSelectBoard = (boardId) => {
        setSelectedBoardId(boardId);
        setView('board');
    };

    const handleBackToDashboard = () => {
        setSelectedBoardId(null);
        setBoardTitle('');
        setView('dashboard');
    };

    return (
        <div className="app-container">
            <Header
                onBack={handleBackToDashboard}
                currentBoardTitle={view === 'board' ? boardTitle : null}
            />
            <main className="main-content">
                {view === 'board' && selectedBoardId ? (
                    <BoardPage
                        boardId={selectedBoardId}
                        onBack={handleBackToDashboard}
                        onSetBoardTitle={setBoardTitle}
                    />
                ) : (
                    <DashboardPage onSelectBoard={handleSelectBoard} />
                )}
            </main>
        </div>
    );
};

export default App;
