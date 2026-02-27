import React, { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import api from '../services/api';

const Vulnerabilities = () => {
    const [vulns, setVulns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // For demo, we either fetch from backend or generate fake if empty
        api.get('/vulns').then(res => {
            if (res.data.vulnerabilities?.length > 0) {
                setVulns(res.data.vulnerabilities);
            } else {
                setVulns([]);
            }
        }).finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h1 style={{ margin: 0, fontSize: '24px' }}>Vulnerabilities List</h1>
            <Card>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ color: 'var(--text-secondary)', fontSize: '13px', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '16px', fontWeight: 500 }}>CVE ID</th>
                            <th style={{ padding: '16px', fontWeight: 500 }}>TITLE</th>
                            <th style={{ padding: '16px', fontWeight: 500 }}>SEVERITY</th>
                            <th style={{ padding: '16px', fontWeight: 500 }}>CVSS</th>
                            <th style={{ padding: '16px', fontWeight: 500 }}>SERVICE</th>
                            <th style={{ padding: '16px', fontWeight: 500 }}>FP SCORE</th>
                            <th style={{ padding: '16px', fontWeight: 500 }}>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vulns.map((v, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s', ':hover': { backgroundColor: 'var(--bg-hover)' } }}>
                                <td style={{ padding: '16px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{v.cveId}</td>
                                <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-primary)' }}>{v.title}</td>
                                <td style={{ padding: '16px' }}><Badge severity={v.status === 'AUTO-SUPPRESSED' ? 'FP' : v.severity}>{v.status === 'AUTO-SUPPRESSED' ? 'Suppressed' : v.severity}</Badge></td>
                                <td style={{ padding: '16px' }}>{v.cvss.toFixed(1)}</td>
                                <td style={{ padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{v.service} ({v.port})</td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ flex: 1, backgroundColor: 'var(--bg-primary)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${v.fpConfidence}%`, height: '100%', backgroundColor: v.fpConfidence >= 70 ? 'var(--fp)' : v.fpConfidence >= 31 ? 'var(--high)' : 'var(--critical)' }} />
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>{v.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default Vulnerabilities;
