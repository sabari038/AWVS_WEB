import React from 'react';
import Card from '../components/ui/Card';
import { FileText, Download, Printer } from 'lucide-react';

const Reports = () => {
    const reports = [
        { title: 'Full Vulnerability Report', desc: 'Comprehensive list of all findings with CVSS scores', type: 'PDF' },
        { title: 'Executive Summary', desc: 'High-level overview of network risk and top issues', type: 'PDF' },
        { title: 'False Positive Audit Trail', desc: 'Log of all suppressed findings and analyst decisions', type: 'CSV' },
        { title: 'Raw Findings Dump', desc: 'Machine-readable JSON of the entire scan dataset', type: 'JSON' }
    ];

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = (type) => {
        import('../services/api').then(({ default: api }) => {
            api.get(`/reports/download?type=${type}`, { responseType: 'blob' }).then(res => {
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `VulnScan_Report_${type}.${type.toLowerCase()}`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }).catch(console.error);
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileText color="var(--accent)" /> Report Generation
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reports.map((r, i) => (
                    <Card key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--text-primary)' }}>{r.title}</h3>
                                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{r.desc}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                {r.type === 'PDF' && (
                                    <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)' }}>
                                        <Printer size={16} /> Print View
                                    </button>
                                )}
                                <button onClick={() => handleDownload(r.type)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '4px', border: 'none', background: 'var(--accent)', color: 'var(--bg-primary)', fontWeight: 600 }}>
                                    <Download size={16} /> Download {r.type}
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Reports;
