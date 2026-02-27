import React, { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import api from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ShieldAlert, Info, AlertTriangle, Bug } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        // Fetch real data from backend
        api.get('/dashboard')
            .then(res => setStats(res.data))
            .catch(err => console.error("Could not fetch dashboard", err));
    }, []);

    if (!stats) return <div style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</div>;

    const pieData = [
        { name: 'Critical', value: stats.critical, color: 'var(--critical)' },
        { name: 'High', value: stats.high, color: 'var(--high)' },
        { name: 'Medium', value: stats.totalVulns - stats.critical - stats.high, color: 'var(--medium)' }
    ];

    const StatBox = ({ title, value, color, icon: Icon }) => (
        <Card style={{ flex: 1, minWidth: '180px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>{title}</div>
                    <div style={{ fontSize: '32px', fontWeight: 700, color }}>{value}</div>
                </div>
                <Icon size={24} color={color} style={{ opacity: 0.8 }} />
            </div>
        </Card>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '24px' }}>Security Dashboard</h1>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--fp)' }} />
                    Live System Monitoring
                </div>
            </div>

            {/* Row 1 - Stats */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <StatBox title="TOTAL ASSETS" value={stats.totalAssets} color="var(--accent)" icon={Server} />
                <StatBox title="VULNERABILITIES" value={stats.totalVulns} color="var(--text-primary)" icon={Bug} />
                <StatBox title="CRITICAL" value={stats.critical} color="var(--critical)" icon={ShieldAlert} />
                <StatBox title="HIGH" value={stats.high} color="var(--high)" icon={AlertTriangle} />
                <StatBox title="FP SUPPRESSED" value={stats.fpSuppressed} color="var(--fp)" icon={Info} />
            </div>

            {/* Row 2 - Charts and Gauges */}
            <div style={{ display: 'flex', gap: '20px' }}>
                <Card title="Risk Distribution" style={{ flex: 1 }}>
                    <div style={{ width: '100%', height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card title="Attack Surface Risk Score" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                        width: '200px', height: '200px', borderRadius: '50%',
                        border: `8px solid ${stats.riskScore > 70 ? 'var(--critical)' : 'var(--high)'}`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        boxShadow: stats.riskScore > 70 ? 'var(--glow-critical)' : 'none'
                    }}>
                        <span style={{ fontSize: '48px', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.riskScore}</span>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>/ 100</span>
                    </div>
                    <div style={{ marginTop: '20px', color: 'var(--critical)', fontWeight: 600 }}>
                        CRITICAL EXPOSURE DETECTED
                    </div>
                </Card>
            </div>

            {/* Row 3 - Top Vulns */}
            <Card title="Top Critical Vulnerabilities">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ color: 'var(--text-secondary)', fontSize: '13px', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '12px', fontWeight: 500 }}>CVE ID</th>
                            <th style={{ padding: '12px', fontWeight: 500 }}>SEVERITY</th>
                            <th style={{ padding: '12px', fontWeight: 500 }}>CVSS</th>
                            <th style={{ padding: '12px', fontWeight: 500 }}>ASSET</th>
                            <th style={{ padding: '12px', fontWeight: 500 }}>FP CONFIDENCE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.recentVulns.map((v, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border)', backgroundColor: i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-tertiary)' }}>
                                <td style={{ padding: '12px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{v.cve}</td>
                                <td style={{ padding: '12px' }}><Badge severity={v.fpConfidence > 70 ? 'FP' : v.severity}>{v.fpConfidence > 70 ? 'Suppressed' : v.severity}</Badge></td>
                                <td style={{ padding: '12px' }}>{v.cvss.toFixed(1)}</td>
                                <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{v.asset}</td>
                                <td style={{ padding: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ flex: 1, backgroundColor: 'var(--bg-primary)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${v.fpConfidence}%`, height: '100%', backgroundColor: v.fpConfidence > 70 ? 'var(--fp)' : v.fpConfidence > 30 ? 'var(--high)' : 'var(--critical)' }} />
                                        </div>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', width: '30px' }}>{v.fpConfidence}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

// Import Server icon for stats
import { Server } from 'lucide-react';

export default Dashboard;
