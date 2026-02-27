import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import useScanStore from '../store/scanStore';
import { Radio, Zap, Shield, Globe } from 'lucide-react';

const CreateScan = () => {
    const navigate = useNavigate();
    const startScan = useScanStore(s => s.startScan);

    const [name, setName] = useState('');
    const [target, setTarget] = useState('');
    const [type, setType] = useState('FAST');
    const [isLoading, setIsLoading] = useState(false);

    const types = [
        { id: 'FAST', name: 'Fast Scan', desc: 'Identifies common top 100 ports & critical CVEs', time: '~2 min', icon: Zap },
        { id: 'DEEP', name: 'Deep Scan', desc: 'Full port map, OS fingerprinting, all local exploits', time: '~10 min', icon: Shield },
        { id: 'WEB', name: 'Web Assessment', desc: 'Focuses on ports 80/443, IIS/Apache misconfigurations', time: '~5 min', icon: Globe }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const id = await startScan(name, target, type);
            navigate(`/scans/${id}/live`);
        } catch (e) {
            alert('Failed to launch scan');
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Radio size={32} color="var(--accent)" />
                <h1 style={{ margin: 0, fontSize: '24px' }}>Launch New Scan</h1>
            </div>

            <Card>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>SCAN NAME</label>
                        <input
                            type="text" required placeholder="e.g., Weekly DMZ Sweep" value={name} onChange={e => setName(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>TARGET (IP or CIDR)</label>
                        <input
                            type="text" required placeholder="192.168.1.100 or 10.0.0.0/24" value={target} onChange={e => setTarget(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>SCAN TEMPLATE</label>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            {types.map(t => {
                                const isSelected = type === t.id;
                                return (
                                    <div key={t.id} onClick={() => setType(t.id)} style={{
                                        flex: 1, padding: '16px', borderRadius: '8px', cursor: 'pointer',
                                        border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                                        backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                                        opacity: isSelected ? 1 : 0.7,
                                        transition: 'all 0.2s',
                                        boxShadow: isSelected ? 'var(--glow-accent)' : 'none'
                                    }}>
                                        <t.icon size={24} color={isSelected ? 'var(--accent)' : 'var(--text-secondary)'} style={{ marginBottom: '12px' }} />
                                        <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>{t.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{t.desc}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>EST. TIME: {t.time}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                        <button type="button" onClick={() => navigate('/dashboard')} style={{ padding: '12px 24px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)' }}>CANCEL</button>
                        <button type="submit" disabled={isLoading} style={{ padding: '12px 24px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--accent)', color: 'var(--bg-primary)', fontWeight: 600 }}>{isLoading ? 'LAUNCHING...' : 'LAUNCH SCAN'}</button>
                    </div>

                </form>
            </Card>
        </div>
    );
};

export default CreateScan;
