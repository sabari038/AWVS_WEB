const express = require('express');
const router = express.Router();
const path = require('path');
const spawn = require('cross-spawn');
const fs = require('fs');
const { memoryStore } = require('../store/memoryStore');

router.get('/download', (req, res) => {
    const type = req.query.type || 'JSON';

    if (type === 'JSON') {
        res.setHeader('Content-disposition', `attachment; filename=VulnScan_Report_${type}.${type.toLowerCase()}`);
        res.setHeader('Content-type', 'application/json');
        res.status(200).send(JSON.stringify(memoryStore, null, 2));
    } else if (type === 'CSV') {
        const vulns = Object.values(memoryStore.vulnerabilities || {});
        let csv = 'CVE_ID,Severity,CVSS,Title,Port\n';
        vulns.forEach(v => {
            const title = v.title ? `"${v.title.replace(/"/g, '""')}"` : '""';
            csv += `${v.cveId || ''},${v.severity || ''},${v.cvss || ''},${title},${v.port || ''}\n`;
        });
        res.setHeader('Content-disposition', `attachment; filename=VulnScan_Report_CSV.csv`);
        res.setHeader('Content-type', 'text/csv');
        res.status(200).send(csv);
    } else if (type === 'PDF') {
        const dbPath = path.join(__dirname, '../../data/db.json');
        const pdfPath = path.join(__dirname, `../../data/temp_report_${Date.now()}.pdf`);
        const scriptPath = path.join(__dirname, '../services/generate_pdf.py');

        const child = spawn('python', [scriptPath, dbPath, pdfPath]);

        child.stdout.on('data', data => console.log(`[PDF Gen] ${data.toString()}`));
        child.stderr.on('data', data => console.error(`[PDF Gen Error] ${data.toString()}`));

        child.on('close', (code) => {
            if (code === 0 && fs.existsSync(pdfPath)) {
                res.setHeader('Content-disposition', 'attachment; filename=VulnScan_Report.pdf');
                res.setHeader('Content-type', 'application/pdf');
                const stream = fs.createReadStream(pdfPath);
                stream.pipe(res);
                stream.on('end', () => {
                    try { fs.unlinkSync(pdfPath); } catch (e) { }
                });
            } else {
                console.error(`[Report Routes] PDF Generation failed with exit code ${code}`);
                res.status(500).json({ error: 'Failed to generate PDF report' });
            }
        });
    }
});

module.exports = router;
