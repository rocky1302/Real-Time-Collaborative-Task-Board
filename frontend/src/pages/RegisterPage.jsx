import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';

export const RegisterPage = ({ onNavigateLogin, onRegisterSuccess }) => {
    const { register } = useAuth();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setDetails([]);
        setLoading(true);
        try {
            await register(username.trim(), email.trim(), password);
            onRegisterSuccess();
        } catch (err) {
            setError(err.message || 'Registration failed');
            if (err.details && Array.isArray(err.details)) {
                setDetails(err.details);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2 className="auth-title">Create an Account</h2>
                <p className="auth-subtitle">Join your team to manage boards, lists, and cards</p>

                {error && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
                            {error}
                        </div>
                        {details.length > 0 && (
                            <ul style={{ color: 'var(--text-primary)', fontSize: '0.8rem', marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                                {details.map((d, i) => (
                                    <li key={i}>{d}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="johndoe"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password (min 4 characters)</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Already have an account?{' '}
                    <span style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }} onClick={onNavigateLogin}>
                        Log In
                    </span>
                </p>
            </div>
        </div>
    );
};
