import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Shield, ShieldAlert, Radio, Server, Network, FileText, Settings, LogOut } from 'lucide-react';

const AppLayout = ({ children }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'New Scan', icon: Radio, path: '/scans/new' },
        { name: 'Vulnerabilities', icon: ShieldAlert, path: '/vulnerabilities' },
        { name: 'False Positives', icon: Shield, path: '/false-positives' },
        { name: 'Assets', icon: Server, path: '/assets' },
        { name: 'Topology', icon: Network, path: '/topology' },
        { name: 'Reports', icon: FileText, path: '/reports' },
    ];

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* Sidebar */}
            <div style={{
                width: '260px',
                backgroundColor: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={24} color="var(--accent)" /> VulnScan Pro
                    </h2>
                </div>

                <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={({ isActive }) => ({
                                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px',
                                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                                backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent',
                                fontWeight: isActive ? 600 : 400,
                                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent'
                            })}
                        >
                            <item.icon size={20} />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                <div style={{ padding: '16px' }}>
                    <button onClick={handleLogout} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px',
                        background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
                        textAlign: 'left', borderRadius: '8px'
                    }}>
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--bg-primary)', padding: '32px' }}>
                {children}
            </div>
        </div>
    );
};

export default AppLayout;
