import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import api from '../services/api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Mock auth to backend
            const res = await api.post('/auth/login', { username, password });
            localStorage.setItem('token', res.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed');
            // Shake animation effect could be added here
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)'
        }}>
            <div style={{
                width: '100%', maxWidth: '400px', padding: '40px',
                backgroundColor: 'var(--bg-secondary)', borderRadius: '12px',
                boxShadow: 'var(--shadow)', border: '1px solid var(--border)',
                textAlign: 'center'
            }}>
                <div style={{ marginBottom: '32px' }}>
                    <ShieldAlert size={48} color="var(--accent)" style={{ filter: 'drop-shadow(var(--glow-accent))' }} />
                    <h1 style={{ marginTop: '16px', marginBottom: '8px', fontSize: '24px', fontWeight: 600 }}>VulnScan Pro</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>Enterprise Vulnerability Management</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>USERNAME</label>
                        <input
                            type="text"
                            value={username} onChange={e => setUsername(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 16px', borderRadius: '6px',
                                border: '1px solid var(--border)', backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '14px',
                                outline: 'none'
                            }}
                            required
                        />
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>PASSWORD</label>
                        <input
                            type="password"
                            value={password} onChange={e => setPassword(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 16px', borderRadius: '6px',
                                border: '1px solid var(--border)', backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '14px',
                                outline: 'none'
                            }}
                            required
                        />
                    </div>

                    {error && (
                        <div style={{
                            color: 'var(--critical)', fontSize: '13px', padding: '10px',
                            backgroundColor: 'rgba(255,61,61,0.1)', borderRadius: '6px', border: '1px solid var(--critical)'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            marginTop: '10px', width: '100%', padding: '14px', borderRadius: '6px',
                            border: '1px solid var(--accent)', backgroundColor: 'transparent',
                            color: 'var(--accent)', fontWeight: 600, fontSize: '14px',
                            cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: 'var(--glow-accent)', opacity: isLoading ? 0.7 : 1
                        }}
                        onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--accent-glow)'; }}
                        onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                        {isLoading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
