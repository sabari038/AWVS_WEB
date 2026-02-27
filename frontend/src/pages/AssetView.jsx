import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import { Server, Shield } from 'lucide-react';

const AssetView = () => {
    const [assets, setAssets] = useState([]);

    React.useEffect(() => {
        import('../services/api').then(({ default: api }) => {
            api.get('/assets').then(res => {
                setAssets(Object.values(res.data.assets || {}));
            }).catch(err => console.error(err));
        });
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Server color="var(--accent)" /> Asset Directory
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {assets.map((a, i) => (
                    <Card key={i} style={{
                        borderLeft: `4px solid ${a.score > 70 ? 'var(--critical)' : a.score > 50 ? 'var(--high)' : 'var(--medium)'}`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'var(--text-primary)' }}>{a.os}</h3>
                                <div style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>{a.ip}</div>
                            </div>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                border: `2px solid ${a.score > 70 ? 'var(--critical)' : a.score > 50 ? 'var(--high)' : 'var(--medium)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '14px'
                            }}>
                                {a.score}
                            </div>
                        </div>

                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            <div style={{ marginBottom: '8px' }}><strong>OS:</strong> {a.os}</div>
                            <div><strong>OPEN PORTS:</strong> {a.ports ? a.ports.join(', ') : 'None'}</div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                            <div style={{ flex: 1, backgroundColor: 'var(--bg-tertiary)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>SERVICES</div>
                                <div style={{ fontSize: '18px', fontWeight: 600 }}>{a.ports ? a.ports.length : 0}</div>
                            </div>
                            <div style={{ flex: 1, backgroundColor: 'rgba(255,61,61,0.05)', border: '1px solid rgba(255,61,61,0.2)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                                <div style={{ fontSize: '12px', color: 'var(--critical)' }}>CRITICAL CVEs</div>
                                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--critical)' }}>{a.riskScore || 0}</div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default AssetView;
