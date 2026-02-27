import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { ShieldCheck, Crosshair, HelpCircle, FileSearch } from 'lucide-react';

const FalsePositives = () => {
    const [tab, setTab] = useState('auto');
    const [vulns, setVulns] = useState([]);

    const fetchVulns = () => {
        import('../services/api').then(({ default: api }) => {
            api.get('/vulns').then(res => setVulns(res.data.vulnerabilities || [])).catch(console.error);
        });
    };

    React.useEffect(() => {
        fetchVulns();
    }, []);

    const handleOverride = async (cveId) => {
        try {
            const { default: api } = await import('../services/api');
            await api.post(`/fp/${cveId}/override`, { reason: 'Analyst Override (Marked Real)' });
            fetchVulns();
        } catch (err) { console.error(err); }
    };

    const handleConfirm = async (cveId) => {
        try {
            const { default: api } = await import('../services/api');
            await api.post(`/fp/${cveId}/decide`, { decision: 'false_positive', reason: 'Analyst Confirmed FP' });
            fetchVulns();
        } catch (err) { console.error(err); }
    };

    const autoData = vulns.filter(v => v.fpAnalysis?.decision === 'false_positive').map(v => ({
        cveId: v.cveId, title: v.title, score: v.fpAnalysis.score, reason: `Auto-scored. Confidence: ${v.fpAnalysis.confidence}`, signals: []
    }));

    const needsReviewData = vulns.filter(v => v.fpAnalysis?.decision === 'needs_review').map(v => ({
        cveId: v.cveId, title: v.title, score: v.fpAnalysis.score, reason: `Needs Manual Review. Score: ${v.fpAnalysis.score}`, signals: []
    }));

    const TabButton = ({ id, label, icon: Icon, active, onClick }) => (
        <button onClick={onClick} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
            backgroundColor: active ? 'var(--bg-tertiary)' : 'transparent',
            color: active ? 'var(--accent)' : 'var(--text-secondary)',
            border: 'none', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
            fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s'
        }}>
            <Icon size={18} /> {label}
        </button>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
                <h1 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShieldCheck color="var(--fp)" /> False Positive Engine
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                    AI-powered signal scoring to reduce alert fatigue by separating confirmed risk from background noise.
                </p>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                <TabButton id="auto" label="Auto-Detected (≥70%)" icon={Crosshair} active={tab === 'auto'} onClick={() => setTab('auto')} />
                <TabButton id="review" label="Needs Review (31-69%)" icon={HelpCircle} active={tab === 'review'} onClick={() => setTab('review')} />
                <TabButton id="log" label="Decision Log" icon={FileSearch} active={tab === 'log'} onClick={() => setTab('log')} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {(tab === 'auto' ? autoData : tab === 'review' ? needsReviewData : []).map((fp, i) => (
                    <Card key={i} title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{fp.cveId}</span>
                            <span style={{ fontSize: '15px' }}>{fp.title}</span>
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>CONFIDENCE</span>
                                <div style={{ width: '100px', height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${fp.score}%`, height: '100%', backgroundColor: fp.score >= 70 ? 'var(--fp)' : 'var(--high)' }} />
                                </div>
                                <span style={{ fontWeight: 600, color: fp.score >= 70 ? 'var(--fp)' : 'var(--high)' }}>{fp.score}%</span>
                            </div>
                        </div>
                    }>
                        <div style={{ display: 'flex', gap: '24px' }}>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>AI DECISION REASONING</h4>
                                <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>{fp.reason}</p>

                                <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>ACTION</h4>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button onClick={() => alert("Signals Triggered:\n" + JSON.stringify(fp.signals, null, 2))} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'pointer' }}>VIEW EVIDENCE</button>
                                    {tab === 'auto' && <button onClick={() => handleOverride(fp.cveId)} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--critical)', background: 'rgba(255,61,61,0.1)', color: 'var(--critical)', cursor: 'pointer' }}>OVERRIDE (MARK REAL)</button>}
                                    {tab === 'review' && <button onClick={() => handleConfirm(fp.cveId)} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: 'var(--fp)', color: '#000', fontWeight: 600, cursor: 'pointer' }}>CONFIRM FP</button>}
                                </div>
                            </div>

                            <div style={{ flex: 1, backgroundColor: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>TRIGGERED SIGNALS</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {fp.signals.map((sig, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'center' }}>
                                            <span style={{ color: sig.flag ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{sig.name}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: sig.flag ? 'var(--fp)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>+{sig.value} pts</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                        <span>TOTAL SCORE</span>
                                        <span style={{ color: fp.score >= 70 ? 'var(--fp)' : 'var(--high)' }}>{fp.score}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default FalsePositives;
