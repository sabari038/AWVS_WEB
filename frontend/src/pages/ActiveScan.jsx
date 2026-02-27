import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useScanStore from '../store/scanStore';
import Card from '../components/ui/Card';
import ProgressBar from '../components/ui/ProgressBar';

const ActiveScan = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { progress, logs, isPolling, pollScanStatus, cancelScan } = useScanStore();
    const logsEndRef = useRef(null);

    useEffect(() => {
        if (!isPolling) {
            pollScanStatus(id);
        }
    }, [id]);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const handleCancel = () => {
        cancelScan(id);
        navigate('/dashboard');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px' }}>Active Scan Execution</h1>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>Scan ID: {id}</div>
                </div>
                {!isPolling && progress >= 100 && (
                    <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 16px', backgroundColor: 'var(--accent)', color: 'var(--bg-primary)', border: 'none', borderRadius: '4px', fontWeight: 600 }}>RETURN TO DASHBOARD</button>
                )}
            </div>

            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>PHASE: {progress < 100 ? 'Running Modules...' : 'Complete'}</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{progress}%</span>
                </div>
                <ProgressBar progress={progress} height="12px" color={progress === 100 ? 'var(--fp)' : 'var(--accent)'} />
            </Card>

            <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                    flex: 1, backgroundColor: '#000', borderRadius: '6px', padding: '16px',
                    fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#0f0',
                    overflowY: 'auto'
                }}>
                    {logs.map((log, i) => (
                        <div key={i} style={{ marginBottom: '4px' }}>{log}</div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </Card>

            {isPolling && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleCancel} style={{ padding: '10px 20px', backgroundColor: 'transparent', color: 'var(--critical)', border: '1px solid var(--critical)', borderRadius: '6px' }}>
                        ABORT SCAN
                    </button>
                </div>
            )}
        </div>
    );
};

export default ActiveScan;
